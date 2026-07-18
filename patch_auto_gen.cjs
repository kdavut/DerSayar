const fs = require('fs');
let code = fs.readFileSync('src/store/useAppStore.ts', 'utf8');

const oldMethod = `  handleAutoGenerateClick: () => {
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
    
    let hasPlacedLessons = false;
    for (const cId of Object.keys(state.schedule)) {
      const classSched = state.schedule[cId];
      if (classSched) {
        for (const day of Object.keys(classSched)) {
          if (classSched[parseInt(day)]?.some(slot => slot !== null)) {
            hasPlacedLessons = true;
            break;
          }
        }
      }
      if (hasPlacedLessons) break;
    }

    if (hasPlacedLessons) {
      store.setIsSchedulingOptionsOpen(true);
    } else {
      store.runAutomaticScheduler(false);
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
          targetTeacherName: teacher.name,
          targetClassName: \`\${i + 1} / \${sortedTeachers.length}\`
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

if (code.includes(oldMethod)) {
  code = code.replace(oldMethod, newMethod);
  fs.writeFileSync('src/store/useAppStore.ts', code);
  console.log("Replaced handleAutoGenerateClick");
} else {
  console.log("Could not find handleAutoGenerateClick exact match.");
}
