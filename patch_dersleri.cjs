const fs = require('fs');
let code = fs.readFileSync('src/store/useAppStore.ts', 'utf8');

code = code.replace(
  "targetClassName: targetClassName || progress.targetClassName",
  "targetClassName: targetClassName || progress.targetClassName,\n        ...extraOpts?.extraProgressFields"
);

fs.writeFileSync('src/store/useAppStore.ts', code);
console.log("Patched dersleri_yerleshtir!");
