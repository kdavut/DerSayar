const fs = require('fs');
let code = fs.readFileSync('src/store/useAppStore.ts', 'utf8');

const oldMethod = `  handleAutoGenerateClick: async () => {
    const store = useAppStore.getState();
    if (!store.user) {
      store.showToast("Değişiklik yapabilmek için lütfen geçerli bir lisansa sahip yönetici hesabı ile giriş yapın (SaaS Lisans Koruması).", "error");
      return;
    }
    const state = store.historyState.current;
    
    if (state.assignments.length === 0) {
      store.showToast("Öncelikle 'Ders Dağıtımı' menüsünden sınıflara ders atamalısınız!", "error");
      return;
    }

    store.setIsSchedulingOptionsOpen(false);
    store.setIsScheduling(true);

    try {
      // 1. Prepare data
      const preparedState = await store.verileri_hazırla();

      // 2. Sort teachers by hardest to place (most weekly hours)
      const teacherHours = new Map<string, number>();
      preparedState.assignments.forEach(a => {
        if (a.teacherId) {
          const tIds = a.teacherId.split(",");
          tIds.forEach(tId => {
            teacherHours.set(tId, (teacherHours.get(tId) || 0) + a.weeklyHours);
          });
        }
      });

      const sortedTeachers = [...preparedState.teachers].sort((a, b) => {
        const hoursA = teacherHours.get(a.id) || 0;
        const hoursB = teacherHours.get(b.id) || 0;
        return hoursB - hoursA; // Descending order
      });

      if (sortedTeachers.length === 0) {
        store.showToast("Öncelikle sisteme öğretmen tanımlamalısınız!", "error");
        store.setIsScheduling(false);
        return;
      }

      // 3. Loop through teachers sequentially
      let totalUnplaced = [];
      let currentState = preparedState;

      for (let i = 0; i < sortedTeachers.length; i++) {
        // Break early if cancelled
        if (!useAppStore.getState().isScheduling) {
           break;
        }

        const teacher = sortedTeachers[i];
        const assignedHours = teacherHours.get(teacher.id) || 0;
        if (assignedHours === 0) continue; // Skip teachers with no assignments

        // Initialize progress for this teacher specifically
        store.setSchedulingProgress({
          phase: "backtracking",
          percent: 5,
          message: "Yerleştiriliyor...",
          steps: 0,
          totalHours: assignedHours,
          placedHours: 0,
          unplacedHours: assignedHours,
          targetTeacherName: \`\${teacher.name} (\${i + 1} / \${sortedTeachers.length})\`,
          targetClassName: ""
        });

        // Only place this teacher's assignments
        const result = await store.dersleri_yerleştir(
          currentState, 
          true, // keepExisting: true
          { teacherIds: [teacher.id] }, 
          { deepSearch: true, numTrials: 9999, maxDurationMs: 180000 } // En derin çözüm, 3 dakika max
        );

        if (result.schedule) {
          // Update the state for the next teacher
          currentState = { ...currentState, schedule: result.schedule };
          store.updateState((draft) => {
            draft.schedule = result.schedule;
          });
        }

        if (result.unplacedReports && result.unplacedReports.length > 0) {
          // Add unplaced reports for this teacher, avoiding duplicates if possible
          totalUnplaced.push(...result.unplacedReports);
        }
      }

      if (useAppStore.getState().isScheduling) {
        const hasUnplaced = totalUnplaced.length > 0;
        if (!hasUnplaced) {
          store.showToast("Tüm öğretmenler başarıyla yerleştirildi!", "success");
        } else {
          store.setUnplacedReports(totalUnplaced);
          store.setIsAnalysisOpen(true);
          store.showToast("Bazı dersler yerleştirilemedi. Lütfen analizi inceleyin.", "info");
        }
      }
    } catch (err) {
      console.error(err);
      store.showToast("Ders programı yerleştirilirken beklenmedik bir hata oluştu!", "error");
    } finally {
      if (useAppStore.getState().isScheduling) {
        store.setIsScheduling(false);
        store.setSchedulingProgress(null);
      }
    }
  },`;

const newMethod = `  handleAutoGenerateClick: async () => {
    const store = useAppStore.getState();
    if (!store.user) {
      store.showToast("Değişiklik yapabilmek için lütfen geçerli bir lisansa sahip yönetici hesabı ile giriş yapın (SaaS Lisans Koruması).", "error");
      return;
    }
    const state = store.historyState.current;
    
    if (state.assignments.length === 0) {
      store.showToast("Öncelikle 'Ders Dağıtımı' menüsünden sınıflara ders atamalısınız!", "error");
      return;
    }

    store.setIsSchedulingOptionsOpen(false);
    store.setIsScheduling(true);

    try {
      // 1. Prepare data
      const preparedState = await store.verileri_hazırla();

      // 2. Calculate class total hours
      const classTotalHours = new Map<string, number>();
      let globalTotalHours = 0;
      preparedState.assignments.forEach(a => {
        classTotalHours.set(a.classId, (classTotalHours.get(a.classId) || 0) + a.weeklyHours);
        globalTotalHours += a.weeklyHours;
      });

      // Calculate initial placed from schedule
      let initialGlobalPlacedSoFar = 0;
      for (const cId of Object.keys(preparedState.schedule || {})) {
        const classSched = preparedState.schedule[cId];
        if (classSched) {
          for (const d of Object.keys(classSched)) {
            classSched[parseInt(d)]?.forEach(slot => {
              if (slot !== null) initialGlobalPlacedSoFar++;
            });
          }
        }
      }

      // 3. Sort teachers
      const teacherStats = new Map<string, { isCoTeaching: boolean, minClassHours: number, totalHours: number }>();
      preparedState.teachers.forEach(t => {
        teacherStats.set(t.id, { isCoTeaching: false, minClassHours: 9999, totalHours: 0 });
      });

      preparedState.assignments.forEach(a => {
        if (a.teacherId) {
          const tIds = a.teacherId.split(",");
          const isCo = tIds.length > 1;
          const cHours = classTotalHours.get(a.classId) || 0;
          tIds.forEach(tId => {
            const stats = teacherStats.get(tId);
            if (stats) {
              stats.totalHours += a.weeklyHours;
              if (isCo) stats.isCoTeaching = true;
              if (cHours < stats.minClassHours) stats.minClassHours = cHours;
            }
          });
        }
      });

      const sortedTeachers = [...preparedState.teachers].sort((a, b) => {
        const statsA = teacherStats.get(a.id)!;
        const statsB = teacherStats.get(b.id)!;
        
        // 1. Co-teaching
        if (statsA.isCoTeaching && !statsB.isCoTeaching) return -1;
        if (!statsA.isCoTeaching && statsB.isCoTeaching) return 1;
        
        // 2. Min Class Hours (ASC)
        if (statsA.minClassHours !== statsB.minClassHours) {
          return statsA.minClassHours - statsB.minClassHours;
        }
        
        // 3. Teacher Total Hours (DESC)
        return statsB.totalHours - statsA.totalHours;
      });

      if (sortedTeachers.length === 0) {
        store.showToast("Öncelikle sisteme öğretmen tanımlamalısınız!", "error");
        store.setIsScheduling(false);
        return;
      }

      // 4. Loop through teachers sequentially
      let totalUnplaced = [];
      let currentState = preparedState;
      let currentGlobalPlaced = initialGlobalPlacedSoFar;

      for (let i = 0; i < sortedTeachers.length; i++) {
        // Break early if cancelled
        if (!useAppStore.getState().isScheduling) {
           break;
        }

        const teacher = sortedTeachers[i];
        const stats = teacherStats.get(teacher.id)!;
        if (stats.totalHours === 0) continue; // Skip teachers with no assignments

        // Initialize progress for this teacher specifically
        store.setSchedulingProgress({
          phase: "backtracking",
          percent: 5,
          message: "Yerleştiriliyor...",
          steps: 0,
          totalHours: stats.totalHours,
          placedHours: 0,
          unplacedHours: stats.totalHours,
          targetTeacherName: \`\${teacher.name} (\${i + 1} / \${sortedTeachers.length})\`,
          targetClassName: "Genel İlerleme",
          globalTotalHours,
          globalPlacedHours: currentGlobalPlaced,
          globalUnplacedHours: globalTotalHours - currentGlobalPlaced
        });

        // Only place this teacher's assignments
        const result = await store.dersleri_yerleştir(
          currentState, 
          true, // keepExisting: true
          { teacherIds: [teacher.id] }, 
          { deepSearch: true, numTrials: 9999, maxDurationMs: 180000, 
            extraProgressFields: {
              targetTeacherName: \`\${teacher.name} (\${i + 1} / \${sortedTeachers.length})\`,
              targetClassName: "Genel İlerleme",
              globalTotalHours,
              globalPlacedHours: currentGlobalPlaced
            }
          } // En derin çözüm, 3 dakika max
        );

        if (result.schedule) {
          // Update the state for the next teacher
          currentState = { ...currentState, schedule: result.schedule };
          store.updateState((draft) => {
            draft.schedule = result.schedule;
          });

          // Recalculate global placed
          currentGlobalPlaced = 0;
          for (const cId of Object.keys(result.schedule || {})) {
            const classSched = result.schedule[cId];
            if (classSched) {
              for (const d of Object.keys(classSched)) {
                classSched[parseInt(d)]?.forEach(slot => {
                  if (slot !== null) currentGlobalPlaced++;
                });
              }
            }
          }
        }

        if (result.unplacedReports && result.unplacedReports.length > 0) {
          // Add unplaced reports for this teacher, avoiding duplicates if possible
          totalUnplaced.push(...result.unplacedReports);
        }
      }

      if (useAppStore.getState().isScheduling) {
        const hasUnplaced = totalUnplaced.length > 0;
        if (!hasUnplaced) {
          store.showToast("Tüm öğretmenler başarıyla yerleştirildi!", "success");
        } else {
          store.setUnplacedReports(totalUnplaced);
          store.setIsAnalysisOpen(true);
          store.showToast("Bazı dersler yerleştirilemedi. Lütfen analizi inceleyin.", "info");
        }
      }
    } catch (err) {
      console.error(err);
      store.showToast("Ders programı yerleştirilirken beklenmedik bir hata oluştu!", "error");
    } finally {
      if (useAppStore.getState().isScheduling) {
        store.setIsScheduling(false);
        store.setSchedulingProgress(null);
      }
    }
  },`;

if (code.includes(oldMethod)) {
  code = code.replace(oldMethod, newMethod);
  fs.writeFileSync('src/store/useAppStore.ts', code);
  console.log("Replaced handleAutoGenerateClick");
} else {
  console.log("Could not find handleAutoGenerateClick exact match.");
}
