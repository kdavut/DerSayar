const fs = require('fs');
let code = fs.readFileSync('src/store/useAppStore.ts', 'utf8');

code = code.replace(
  "extraOpts?: { deepSearch?: boolean, numTrials?: number, maxDurationMs?: number }",
  "extraOpts?: { deepSearch?: boolean, numTrials?: number, maxDurationMs?: number, extraProgressFields?: any }"
);

fs.writeFileSync('src/store/useAppStore.ts', code);
console.log("Patched types!");
