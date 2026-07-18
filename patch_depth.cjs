const fs = require('fs');
let code = fs.readFileSync('src/utils/scheduler.worker.ts', 'utf8');

const targetStr = `            const success = await tryChainShiftRecursive(
              block.assignment.id,
              d_target,
              p_target,
              new Set(),
              1,
              4
            );`;

const newStr = `            const adaptiveMaxChainDepth = isTargeted ? 8 : (restartCount === 0 ? 5 : 6 + (restartCount % 3));
            const success = await tryChainShiftRecursive(
              block.assignment.id,
              d_target,
              p_target,
              new Set(),
              1,
              adaptiveMaxChainDepth
            );`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, newStr);
  fs.writeFileSync('src/utils/scheduler.worker.ts', code);
  console.log("Patched chain depth!");
} else {
  console.log("Could not find targetStr!");
}
