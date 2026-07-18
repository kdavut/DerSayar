const fs = require('fs');
let code = fs.readFileSync('src/utils/scheduler.ts', 'utf8');

const targetStr = `export function restoreMissingTeacherHours(
  initialSched: ClassScheduleMap,
  newSched: ClassScheduleMap,
  state: AppState
): ClassScheduleMap {
  let finalSchedule = JSON.parse(JSON.stringify(newSched));`;

const newStr = `export function restoreMissingTeacherHours(
  initialSched: ClassScheduleMap,
  newSched: ClassScheduleMap,
  state: AppState
): ClassScheduleMap {
  return newSched; // Disabled because it causes duplication bugs
  let finalSchedule = JSON.parse(JSON.stringify(newSched));`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, newStr);
  fs.writeFileSync('src/utils/scheduler.ts', code);
  console.log("Patched!");
} else {
  console.log("Could not find targetStr!");
}
