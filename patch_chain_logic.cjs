const fs = require('fs');
let code = fs.readFileSync('src/utils/scheduler.worker.ts', 'utf8');

const oldFuncStart = `      const tryChainShiftRecursive = async (`;
const oldFuncEnd = `      const combinedConflicts = new Set<string>();`;

const startIdx = code.indexOf(oldFuncStart);
const endIdx = code.indexOf(oldFuncEnd);

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `
      const tryChainShiftRecursive = async (
        assignmentId: string,
        targetD: number,
        targetP: number,
        visited: Set<string>,
        chainDepth: number,
        maxChainDepth: number,
        exactSourceD: number = -1,
        exactSourceP: number = -1,
        exactBlockSize: number = 0,
        exactClassId: string = ""
      ): Promise<boolean> => {
        // CPU ve sonsuz döngü koruması: CPU zamanını dengeleme
        if (Date.now() - startTime > maxDurationMs) return false;
        
        if (chainDepth > maxChainDepth) return false;
        if (visited.has(assignmentId)) return false;

        const assignObj = assignmentsMap.get(assignmentId);
        if (!assignObj) return false;

        const classId = exactClassId || assignObj.classId;
        const classObj = classesMap.get(classId);
        if (!classObj) return false;

        let sourceD = exactSourceD;
        let sourceP = exactSourceP;
        let blockSize = exactBlockSize;

        if (sourceD === -1 || blockSize === 0) {
          const slotsToMove: ScheduleSlot[] = [];
          for (let d = 0; d < numDays && sourceD === -1; d++) {
            for (let p = 0; p < numPeriods; p++) {
              const slot = currentSchedule[classId]?.[d]?.[p];
              if (slot && slot.assignmentId === assignmentId) {
                sourceD = d;
                sourceP = p;
                let currP = p;
                while (currP < numPeriods) {
                  const s = currentSchedule[classId]?.[d]?.[currP];
                  if (s && s.assignmentId === assignmentId) {
                    slotsToMove.push(s);
                    currP++;
                  } else {
                    break;
                  }
                }
                blockSize = slotsToMove.length;
                break;
              }
            }
          }
        }
        
        if (blockSize === 0) blockSize = 1;

        if (sourceD === targetD && sourceP === targetP) {
          return true;
        }

        for (let offset = 0; offset < blockSize; offset++) {
          const currP = targetP + offset;
          if (currP >= numPeriods) return false;
          if (classObj.unavailability[targetD]?.[currP] === true) return false;
          if (assignObj.teacherId) {
            const tIds = parseTeacherIds(assignObj.teacherId);
            for (const tId of tIds) {
              const teacher = teachersMap.get(tId);
              if (teacher?.unavailability[targetD]?.[currP] === true) return false;
            }
          }
          if (assignObj.classroomId) {
            const classroom = classroomsMap.get(assignObj.classroomId);
            if (classroom?.unavailability[targetD]?.[currP] === true) return false;
          }
        }

        const conflicts = new Map<string, {d: number, p: number, size: number, conflictClassId: string}>();
        
        const checkAndAddConflict = (occupiedSlot: ScheduleSlot | null, busyClassId: string, currP: number) => {
           if (occupiedSlot && occupiedSlot.assignmentId !== assignmentId) {
              if (!conflicts.has(occupiedSlot.assignmentId)) {
                 let startP = currP;
                 while(startP > 0 && currentSchedule[busyClassId]?.[targetD]?.[startP - 1]?.assignmentId === occupiedSlot.assignmentId) {
                   startP--;
                 }
                 let endP = currP;
                 while(endP < numPeriods - 1 && currentSchedule[busyClassId]?.[targetD]?.[endP + 1]?.assignmentId === occupiedSlot.assignmentId) {
                   endP++;
                 }
                 conflicts.set(occupiedSlot.assignmentId, {d: targetD, p: startP, size: endP - startP + 1, conflictClassId: busyClassId});
              }
           }
        };

        for (let offset = 0; offset < blockSize; offset++) {
          const currP = targetP + offset;
          checkAndAddConflict(currentSchedule[classId]?.[targetD]?.[currP], classId, currP);
          if (assignObj.teacherId) {
            const tIds = parseTeacherIds(assignObj.teacherId);
            for (const tId of tIds) {
              const busyClassId = currentTeacherOccupancy[tId]?.[targetD]?.[currP];
              if (busyClassId && busyClassId !== classId) {
                checkAndAddConflict(currentSchedule[busyClassId]?.[targetD]?.[currP], busyClassId, currP);
              }
            }
          }
          if (assignObj.classroomId) {
            const busyClassId = currentClassroomOccupancy[assignObj.classroomId]?.[targetD]?.[currP];
            if (busyClassId && busyClassId !== classId) {
              checkAndAddConflict(currentSchedule[busyClassId]?.[targetD]?.[currP], busyClassId, currP);
            }
          }
        }

        for (const [confId, confData] of conflicts.entries()) {
          if (visited.has(confId)) return false; 
          const confAssignObj = assignmentsMap.get(confId);
          if (!confAssignObj) return false;
          if (options?.priorityAssignmentIds && options.priorityAssignmentIds.includes(confId)) {
            return false;
          }
        }

        const backupSchedule = cloneSchedule(currentSchedule);
        const backupTeacherOccupancy = cloneOccupancy(currentTeacherOccupancy, numDays);
        const backupClassroomOccupancy = cloneOccupancy(currentClassroomOccupancy, numDays);

        const nextVisited = new Set(visited);
        nextVisited.add(assignmentId);

        if (sourceD !== -1) {
          for (let offset = 0; offset < blockSize; offset++) {
            const sP = sourceP + offset;
            const slot = backupSchedule[classId][sourceD]?.[sP];
            if (slot && slot.assignmentId === assignmentId) {
              backupSchedule[classId][sourceD][sP] = null;
              clearOccupancy(classId, sourceD, sP, slot, backupTeacherOccupancy, backupClassroomOccupancy);
            }
          }
        }

        let allResolved = true;
        for (const [confId, confData] of conflicts.entries()) {
          const confAssign = assignmentsMap.get(confId);
          if (!confAssign) {
            allResolved = false;
            break;
          }
          let resolvedThisConflict = false;
          
          // ChainedShiftReassignment (K-Dereceli Akıllı Seçim ve Katmanlı Genişleme)
          // Her aday boşluk için Relaxation Heuristic (esneklik / daha az kısıt) skoru oluşturulur
          const candidates: { d: number; p: number; score: number }[] = [];
          
          for (let nd = 0; nd < numDays; nd++) {
            if (classesMap.get(confAssign.classId)?.unavailability[nd]?.every(p => p === true)) continue;
            for (let np = 0; np <= numPeriods - confData.size; np++) {
              if (nd === targetD && np >= confData.p && np < confData.p + confData.size) continue;
              
              let score = 0;
              for(let o = 0; o < confData.size; o++) {
                 const currP = np + o;
                 // Add penalty for class conflict
                 if (backupSchedule[confAssign.classId]?.[nd]?.[currP] !== null) {
                    score += 10;
                 }
                 // Add penalty for teacher conflict
                 if (confAssign.teacherId) {
                    const tIds = parseTeacherIds(confAssign.teacherId);
                    for (const tId of tIds) {
                      if (backupTeacherOccupancy[tId]?.[nd]?.[currP]) {
                         score += 15;
                      }
                    }
                 }
                 // Add penalty for classroom conflict
                 if (confAssign.classroomId) {
                    if (backupClassroomOccupancy[confAssign.classroomId]?.[nd]?.[currP]) {
                       score += 10;
                    }
                 }
              }
              // Rasgelelik ile eşit skorlarda tekilliği kırmak
              score += random();
              candidates.push({ d: nd, p: np, score });
            }
          }

          // En az kısıtı olanlardan başlayarak sıralama
          candidates.sort((a, b) => a.score - b.score);
          
          // Katmanlı 5 adımlı branşlaşma (Branch factor: 5)
          const possibleSlots = candidates.slice(0, 5);

          for (const slot of possibleSlots) {
            const oldSchedule = currentSchedule;
            const oldTeacher = currentTeacherOccupancy;
            const oldClassroom = currentClassroomOccupancy;
            
            currentSchedule = backupSchedule;
            currentTeacherOccupancy = backupTeacherOccupancy;
            currentClassroomOccupancy = backupClassroomOccupancy;
            
            // Recursive Chain Swap - Atomik İşlem (Transaction mantığı)
            const success = await tryChainShiftRecursive(
              confId,
              slot.d,
              slot.p,
              nextVisited,
              chainDepth + 1,
              maxChainDepth,
              confData.d,
              confData.p,
              confData.size,
              confData.conflictClassId
            );
            
            // Transaction Rollback / Restore Context
            currentSchedule = oldSchedule;
            currentTeacherOccupancy = oldTeacher;
            currentClassroomOccupancy = oldClassroom;
            
            if (success) {
              resolvedThisConflict = true;
              break;
            }
          }
          if (!resolvedThisConflict) {
            allResolved = false;
            break;
          }
        }

        if (allResolved) {
          for (let offset = 0; offset < blockSize; offset++) {
            const tP = targetP + offset;
            const slot = {
              assignmentId: assignObj.id,
              courseId: assignObj.courseId,
              teacherId: assignObj.teacherId,
              classroomId: assignObj.classroomId
            };
            backupSchedule[classId][targetD][tP] = slot;
            registerOccupancy(classId, targetD, tP, slot, backupTeacherOccupancy, backupClassroomOccupancy);
          }

          for (const cId of Object.keys(currentSchedule)) {
            for (let d = 0; d < numDays; d++) {
              currentSchedule[cId][d] = [...backupSchedule[cId][d]];
            }
          }
          for (const tId of Object.keys(currentTeacherOccupancy)) {
            for (let d = 0; d < numDays; d++) {
              currentTeacherOccupancy[tId][d] = [...backupTeacherOccupancy[tId][d]];
            }
          }
          for (const rId of Object.keys(currentClassroomOccupancy)) {
            for (let d = 0; d < numDays; d++) {
              currentClassroomOccupancy[rId][d] = [...backupClassroomOccupancy[rId][d]];
            }
          }
          return true;
        }

        return false;
      };
`;

  code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
  fs.writeFileSync('src/utils/scheduler.worker.ts', code);
  console.log("Patched successfully!");
} else {
  console.log("Could not find targets!");
}
