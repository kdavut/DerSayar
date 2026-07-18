const fs = require('fs');
let code = fs.readFileSync('src/utils/scheduler.worker.ts', 'utf8');

code = code.replace(
  "const course = coursesMap.get(confAssignObj.courseId);\n          if (course?.isLocked) return false;",
  "// Removed invalid course?.isLocked check"
);

fs.writeFileSync('src/utils/scheduler.worker.ts', code);
