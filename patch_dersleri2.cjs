const fs = require('fs');
let code = fs.readFileSync('src/store/useAppStore.ts', 'utf8');

const oldStr = `        targetClassName: targetClassName || progress.targetClassName,
        ...extraOpts?.extraProgressFields`;

const newStr = `        targetClassName: targetClassName || progress.targetClassName,
        ...extraOpts?.extraProgressFields,
        globalPlacedHours: extraOpts?.extraProgressFields?.globalTotalHours !== undefined 
            ? (extraOpts.extraProgressFields.globalPlacedHours + (progress.placedHours || 0)) 
            : extraOpts?.extraProgressFields?.globalPlacedHours,
        globalUnplacedHours: extraOpts?.extraProgressFields?.globalTotalHours !== undefined 
            ? (extraOpts.extraProgressFields.globalTotalHours - (extraOpts.extraProgressFields.globalPlacedHours + (progress.placedHours || 0))) 
            : extraOpts?.extraProgressFields?.globalUnplacedHours`;

if (code.includes(oldStr)) {
  code = code.replace(oldStr, newStr);
  fs.writeFileSync('src/store/useAppStore.ts', code);
  console.log("Patched dersleri_yerleshtir with dynamic totals!");
} else {
  console.log("Could not find oldStr!");
}
