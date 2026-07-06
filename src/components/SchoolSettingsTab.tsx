import React from 'react';
import { motion } from 'motion/react';
import { School, Settings } from 'lucide-react';
import { AppState } from '../types';

interface SchoolSettingsTabProps {
  state: AppState;
  handleUpdateSchoolName: (name: string) => void;
  handleUpdatePrincipalName: (name: string) => void;
  handleToggleDay: (day: string) => void;
  handleUpdatePeriodsCount: (count: number) => void;
  handleUpdateLunchBreakAfter: (after: number) => void;
  handleUpdateLunchBreakDuration: (duration: number) => void;
  handleUpdatePeriodTime: (index: number, type: "start" | "end", val: string) => void;
}

export default function SchoolSettingsTab({
  state,
  handleUpdateSchoolName,
  handleUpdatePrincipalName,
  handleToggleDay,
  handleUpdatePeriodsCount,
  handleUpdateLunchBreakAfter,
  handleUpdateLunchBreakDuration,
  handleUpdatePeriodTime,
}: SchoolSettingsTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl space-y-6"
    >
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-slate-800">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
          <School className="w-5 h-5 text-blue-600" />
          <span>Okul Genel Bilgileri</span>
        </h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Okul Adı
              </label>
              <input
                type="text"
                value={state.settings.schoolName || ""}
                onChange={(e) => handleUpdateSchoolName(e.target.value)}
                placeholder="Örn: Atatürk Anadolu Lisesi"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Okul Müdürü Adı Soyadı
              </label>
              <input
                type="text"
                value={state.settings.principalName || ""}
                onChange={(e) => handleUpdatePrincipalName(e.target.value)}
                placeholder="Örn: Süleyman Yılmaz"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Ders Yapılan Günler (Aktif Günler)
              </label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap gap-x-4 gap-y-2">
                {["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"].map((day) => {
                  const isChecked = state.settings.days.includes(day);
                  return (
                    <label key={day} className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleDay(day)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span>{day}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Günlük En Fazla Ders Saati
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={state.settings.periodsPerDay}
                  onChange={(e) => handleUpdatePeriodsCount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Öğle Arası (Hangi Dersten Sonra?)
              </label>
              <select
                value={state.settings.lunchBreakAfter ?? 0}
                onChange={(e) => handleUpdateLunchBreakAfter(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
              >
                <option value="0">Öğle Arası Yok</option>
                {Array.from({ length: state.settings.periodsPerDay - 1 }, (_, i) => i + 1).map((p) => (
                  <option key={p} value={p}>{p}. Dersten Sonra</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Öğle Arası Süresi (Dakika)
              </label>
              <input
                type="number"
                min="1"
                max="180"
                value={state.settings.lunchBreakDuration ?? 45}
                onChange={(e) => handleUpdateLunchBreakDuration(Number(e.target.value))}
                disabled={!(state.settings.lunchBreakAfter && state.settings.lunchBreakAfter > 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-slate-800 max-w-md">
        <h2 className="text-sm font-bold text-slate-800 mb-3.5 flex items-center space-x-2 border-b border-slate-100 pb-2">
          <Settings className="w-4 h-4 text-blue-600" />
          <span>Ders Saatleri (Periyot Planlaması)</span>
        </h2>

        <div className="flex flex-col gap-2">
          {state.settings.periodTimes.map((time, idx) => (
            <React.Fragment key={idx}>
              <div
                className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200/60 hover:border-slate-300 transition-all gap-4"
              >
                <span className="text-xs font-bold text-slate-600 shrink-0 w-16">
                  {idx + 1}. Ders Saat
                </span>
                <div className="flex items-center space-x-2 w-40 shrink-0">
                  <input
                    type="text"
                    value={time.start}
                    onChange={(e) => handleUpdatePeriodTime(idx, "start", e.target.value)}
                    placeholder="08:30"
                    className="w-16 text-center bg-white border border-slate-200 rounded-lg py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <span className="text-slate-400 font-bold">-</span>
                  <input
                    type="text"
                    value={time.end}
                    onChange={(e) => handleUpdatePeriodTime(idx, "end", e.target.value)}
                    placeholder="09:10"
                    className="w-16 text-center bg-white border border-slate-200 rounded-lg py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
              {state.settings.lunchBreakAfter === idx + 1 && (
                <div className="flex items-center justify-center py-1.5 px-3 bg-amber-50 rounded-lg border border-amber-200/60 text-amber-800 text-[11px] font-bold space-x-1 shadow-sm my-1">
                  <span>🍽️ {idx + 1}. Dersten Sonra Öğle Arası ({state.settings.lunchBreakDuration || 45} dk)</span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
