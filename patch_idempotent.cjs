const fs = require('fs');
let code = fs.readFileSync('src/utils/scheduler.worker.ts', 'utf8');

const targetStr = `    let isIdempotentValid = true;
    for (const assign of assignments) {
      const initial = scheduledHoursCount[assign.id] || 0;
      const current = scheduledHoursInThisTrial[assign.id] || 0;
      if (current < initial) {
        isIdempotentValid = false;
        break;
      }
    }`;

const newStr = `    let isIdempotentValid = true;
    for (const assign of assignments) {
      const initial = scheduledHoursCount[assign.id] || 0;
      const current = scheduledHoursInThisTrial[assign.id] || 0;
      if (current < initial || current > assign.weeklyHours) {
        isIdempotentValid = false;
        break;
      }
    }`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, newStr);
  fs.writeFileSync('src/utils/scheduler.worker.ts', code);
  console.log("Patched isIdempotentValid!");
} else {
  console.log("Could not find targetStr!");
}
