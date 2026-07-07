import React from "react";
import { motion } from "motion/react";
import { BookOpen, Plus, Edit3, Trash2 } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { Course } from "../types";

export default function CoursesTab() {
  const {
    historyState,
    newCourse,
    setNewCourse,
    editingCourseId,
    setEditingCourseId,
    setConfirmModal,
    updateState,
    showToast,
  } = useAppStore();

  const state = historyState.current;

  const handleCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.name.trim() || !newCourse.code.trim()) {
      showToast("Lütfen ders adı ve kısa adını doldurun!", "error");
      return;
    }

    const cleanPlacement = newCourse.placementMode.trim();
    if (!/^[1-9][0-9]*(\+[1-9][0-9]*)*$/.test(cleanPlacement)) {
      showToast("Yerleşme biçimi sadece rakamlardan ve aralarındaki '+' işaretlerinden oluşmalıdır! Örn: 2+2+2", "error");
      return;
    }

    const parts = cleanPlacement.split("+").map(p => parseInt(p.trim(), 10));
    const sum = parts.reduce((acc, curr) => acc + curr, 0);
    const weeklyHoursNum = Number(newCourse.weeklyHours);

    if (sum !== weeklyHoursNum) {
      showToast(`Girdiğiniz dağılım toplamı (${sum}) haftalık ders saatine (${weeklyHoursNum}) eşit olmalıdır!`, "error");
      return;
    }

    updateState((draft) => {
      if (editingCourseId) {
        const item = draft.courses.find((c) => c.id === editingCourseId);
        if (item) {
          item.name = newCourse.name;
          item.code = newCourse.code.toUpperCase();
          item.weeklyHours = weeklyHoursNum;
          item.placementMode = cleanPlacement;
        }
        setEditingCourseId(null);
        showToast("Ders tanımı güncellendi.", "success");
      } else {
        const id = "crs_" + Date.now();
        const item: Course = {
          id,
          name: newCourse.name,
          code: newCourse.code.toUpperCase(),
          weeklyHours: weeklyHoursNum,
          placementMode: cleanPlacement
        };
        draft.courses.push(item);
        showToast(`"${newCourse.name}" ders tanımı sisteme eklendi.`, "success");
      }
    });
    setNewCourse({ name: "", code: "", weeklyHours: 2, placementMode: "2" });
  };

  const handleEditCourse = (c: Course) => {
    setNewCourse({
      name: c.name,
      code: c.code,
      weeklyHours: c.weeklyHours,
      placementMode: c.placementMode
    });
    setEditingCourseId(c.id);
  };

  const handleDeleteCourse = (id: string) => {
    const item = state.courses.find((c) => c.id === id);
    setConfirmModal({
      isOpen: true,
      title: "Dersi Sil",
      message: `"${item?.name}" dersini silmek istediğinize emin misiniz? Bu derse bağlı tüm ders dağıtımları ve program yerleşimleri silinecektir.`,
      isDangerous: true,
      confirmText: "Evet, Sil",
      action: () => {
        updateState((draft) => {
          draft.courses = draft.courses.filter((c) => c.id !== id);
          draft.assignments = draft.assignments.filter((a) => a.courseId !== id);
          // Clean schedule
          Object.keys(draft.schedule).forEach((cId) => {
            const classSchedules = draft.schedule[cId];
            if (classSchedules) {
              Object.keys(classSchedules).forEach((dIdxStr) => {
                const dIdx = parseInt(dIdxStr, 10);
                if (Array.isArray(classSchedules[dIdx])) {
                  classSchedules[dIdx] = classSchedules[dIdx].map((slot) => {
                    return slot?.courseId === id ? null : slot;
                  });
                }
              });
            }
          });
        });
        showToast("Ders tanımı ve ilgili yerleşimleri silindi.", "info");
        setConfirmModal(null);
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-7xl mx-auto space-y-6 text-slate-800"
    >
      {/* Form ders */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <span>{editingCourseId ? "Ders Tanımını Düzenle" : "Ders Tanımlama Formu"}</span>
        </h2>

        <form onSubmit={handleCourseSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Dersin Adı</label>
              <input
                type="text"
                value={newCourse.name}
                onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                placeholder="Örn: Türk Dili ve Edebiyatı"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Ders Kodu (Kısaltma)</label>
              <input
                type="text"
                value={newCourse.code}
                onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                placeholder="Örn: MAT, FİZ, TDE"
                maxLength={8}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-semibold"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Haftalık Saati</label>
              <input
                type="number"
                min="1"
                max="20"
                value={newCourse.weeklyHours}
                onChange={(e) => setNewCourse({ ...newCourse, weeklyHours: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Yerleşme Biçimi (Dağılım)</label>
              <input
                type="text"
                value={newCourse.placementMode}
                onChange={(e) => setNewCourse({ ...newCourse, placementMode: e.target.value })}
                placeholder="Örn: 2+2+2 veya 3+3"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-bold text-blue-700"
                required
              />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-[10px] text-slate-600 font-semibold leading-relaxed">
              <span className="text-blue-600 font-extrabold">Dağılım Kuralı:</span> Toplamı tam olarak haftalık saate (<span className="font-bold text-blue-600 font-mono">{newCourse.weeklyHours}</span>) eşit olmalı ve saatler arasına <span className="font-extrabold text-blue-600 font-mono">+</span> konulmalıdır (Örn: <span className="font-mono bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 text-blue-700">2+2+2</span>).
            </p>

            <div className="flex gap-2 shrink-0">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition duration-150 flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-blue-100"
              >
                <Plus className="w-4 h-4" />
                <span>{editingCourseId ? "Değişiklikleri Kaydet" : "Yeni Ders Ekle"}</span>
              </button>
              {editingCourseId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCourseId(null);
                    setNewCourse({ name: "", code: "", weeklyHours: 2, placementMode: "2" });
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  İptal
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* List ders */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col w-full">
        <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <span>Tanımlı Okul Dersleri ({state.courses.length})</span>
        </h2>

        <div className="w-full bg-white border border-slate-300 rounded-xl overflow-hidden shadow-sm">
          {state.courses.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-semibold">Hiç ders tanımlanmamış.</div>
          ) : (
            <table className="w-full text-xs text-left text-slate-700 border-collapse border border-slate-300">
              <thead>
                <tr className="text-[10px] text-slate-700 uppercase tracking-wider bg-slate-100 sticky top-0 z-10">
                  <th className="py-2.5 px-4 font-extrabold text-slate-700 text-center w-12 bg-slate-100 border border-slate-300">SIRA</th>
                  <th className="py-2.5 px-4 font-extrabold text-slate-700 bg-slate-100 border border-slate-300 w-28">KOD</th>
                  <th className="py-2.5 px-4 font-extrabold text-slate-700 bg-slate-100 border border-slate-300">DERS ADI</th>
                  <th className="py-2.5 px-4 font-extrabold text-slate-700 text-center bg-slate-100 border border-slate-300 w-28">HAFTALIK SAATİ</th>
                  <th className="py-2.5 px-4 font-extrabold text-slate-700 text-center bg-slate-100 border border-slate-300 w-32">YERLEŞME BİÇİMİ (DAĞILIM)</th>
                  <th className="py-2.5 px-4 font-extrabold text-slate-700 text-right w-28 bg-slate-100 border border-slate-300">İŞLEMLER</th>
                </tr>
              </thead>
              <tbody>
                {state.courses.map((crs, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <tr
                      key={crs.id}
                      className={`transition-colors ${
                        isEven ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-50"
                      }`}
                    >
                      <td className="py-2.5 px-4 text-center font-bold text-slate-500 border border-slate-200 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-4 border border-slate-200">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono font-bold text-[10px] rounded border border-blue-200">
                          {crs.code}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-800 border border-slate-200">{crs.name}</td>
                      <td className="py-2.5 px-4 text-center font-extrabold text-slate-700 border border-slate-200 font-mono">{crs.weeklyHours || 2} Saat</td>
                      <td className="py-2.5 px-4 text-center font-bold text-blue-700 border border-slate-200 font-mono">{crs.placementMode || "2"}</td>
                      <td className="py-2.5 px-4 text-right border border-slate-200">
                        <div className="inline-flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleEditCourse(crs)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Düzenle"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(crs.id)}
                            className="p-1 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </motion.div>
  );
}
