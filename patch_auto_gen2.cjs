const fs = require('fs');
let code = fs.readFileSync('src/store/useAppStore.ts', 'utf8');

code = code.replace(
  "targetTeacherName: teacher.name,",
  "targetTeacherName: `${teacher.name} (${i + 1} / ${sortedTeachers.length})`,"
);
code = code.replace(
  "targetClassName: \\`\\${i + 1} / \\${sortedTeachers.length}\\`",
  ""
);

fs.writeFileSync('src/store/useAppStore.ts', code);
