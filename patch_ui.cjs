const fs = require('fs');
let code = fs.readFileSync('src/components/ScheduleTab.tsx', 'utf8');

const oldGrid = `                  {/* Minimalist Live Counters Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <div className="text-center space-y-0.5">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Atanan Ders</span>
                      <span className="block text-base font-extrabold text-slate-700">
                        {schedulingProgress.totalHours ?? state.assignments.reduce((sum, a) => sum + a.weeklyHours, 0)}
                      </span>
                    </div>
                    <div className="text-center space-y-0.5 border-x border-slate-200/60">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Yerleşen</span>
                      <span className="block text-base font-extrabold text-emerald-600">
                        {schedulingProgress.placedHours ?? 0}
                      </span>
                    </div>
                    <div className="text-center space-y-0.5">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kalan Ders</span>
                      <span className="block text-base font-extrabold text-rose-500">
                        {schedulingProgress.unplacedHours ?? 0}
                      </span>
                    </div>
                  </div>`;

const newGrid = `                  {/* Minimalist Live Counters Grid */}
                  {schedulingProgress.globalTotalHours !== undefined ? (
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <div className="text-center space-y-0.5">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Toplam Ders</span>
                        <span className="block text-base font-extrabold text-slate-700">
                          {schedulingProgress.globalTotalHours}
                        </span>
                      </div>
                      <div className="text-center space-y-0.5 border-x border-slate-200/60">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Yerleşen (Toplam)</span>
                        <span className="block text-base font-extrabold text-emerald-600">
                          {schedulingProgress.globalPlacedHours}
                        </span>
                      </div>
                      <div className="text-center space-y-0.5">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kalan (Toplam)</span>
                        <span className="block text-base font-extrabold text-rose-500">
                          {schedulingProgress.globalUnplacedHours}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <div className="text-center space-y-0.5">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Atanan Ders</span>
                        <span className="block text-base font-extrabold text-slate-700">
                          {schedulingProgress.totalHours ?? state.assignments.reduce((sum, a) => sum + a.weeklyHours, 0)}
                        </span>
                      </div>
                      <div className="text-center space-y-0.5 border-x border-slate-200/60">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Yerleşen</span>
                        <span className="block text-base font-extrabold text-emerald-600">
                          {schedulingProgress.placedHours ?? 0}
                        </span>
                      </div>
                      <div className="text-center space-y-0.5">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kalan Ders</span>
                        <span className="block text-base font-extrabold text-rose-500">
                          {schedulingProgress.unplacedHours ?? 0}
                        </span>
                      </div>
                    </div>
                  )}`;

if (code.includes(oldGrid)) {
  code = code.replace(oldGrid, newGrid);
  fs.writeFileSync('src/components/ScheduleTab.tsx', code);
  console.log("Patched UI!");
} else {
  console.log("Could not find oldGrid!");
}
