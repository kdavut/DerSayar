const fs = require('fs');
let code = fs.readFileSync('src/utils/scheduler.worker.ts', 'utf8');

const targetLns = `      // 2. Select randomly to clear (higher ratio for targeted to allow enough restructuring)
      const clearRatio = isTargeted ? 0.35 : 0.10;
      const minClear = isTargeted ? 3 : 1;
      const numToClear = Math.max(minClear, Math.floor(placedSlotsList.length * clearRatio));

      const shuffledSlots = shuffle([...placedSlotsList]);
      const slotsToClear = shuffledSlots.slice(0, numToClear);`;

const newLns = `      // Öneri 3: Hedef Odaklı ve Adaptif LNS Bozması (Targeted Adaptive LNS Destruction)
      // Tıkanıklık sürdükçe bozma oranını artırıyor ve özellikle yerleşemeyen derslerin 
      // sınıflarına/öğretmenlerine ait mevcut yerleşimleri bozmaya öncelik veriyoruz.
      const adaptiveRatio = Math.min(0.50, (isTargeted ? 0.35 : 0.10) + (consecutiveLnsRepairsWithoutImprovement * 0.05));
      const minClear = isTargeted ? 3 : 1;
      const numToClear = Math.max(minClear, Math.floor(placedSlotsList.length * adaptiveRatio));

      // Extract trouble classes and teachers from unplaced
      const troubleClasses = new Set<string>();
      const troubleTeachers = new Set<string>();
      bestGlobalUnplaced.forEach(b => {
        troubleClasses.add(b.assignment.classId);
        if (b.assignment.teacherId) {
          parseTeacherIds(b.assignment.teacherId).forEach(t => troubleTeachers.add(t));
        }
      });

      // Weight the placed slots: higher weight if they belong to a trouble class or teacher
      const weightedSlots = placedSlotsList.map(item => {
        let weight = random();
        if (troubleClasses.has(item.classId)) weight += 2.0;
        const assign = assignmentsMap.get(item.slot.assignmentId);
        if (assign && assign.teacherId) {
          const tIds = parseTeacherIds(assign.teacherId);
          if (tIds.some(t => troubleTeachers.has(t))) {
            weight += 2.0;
          }
        }
        return { item, weight };
      });

      // Sort by weight descending so we clear the trouble areas first
      weightedSlots.sort((a, b) => b.weight - a.weight);
      
      const slotsToClear = weightedSlots.slice(0, numToClear).map(w => w.item);`;

if (code.includes(targetLns)) {
  code = code.replace(targetLns, newLns);
  fs.writeFileSync('src/utils/scheduler.worker.ts', code);
  console.log("Patched LNS!");
} else {
  console.log("Could not find targetLns!");
}
