const fs = require('fs');
let code = fs.readFileSync('src/utils/scheduler.worker.ts', 'utf8');

const targetStr = `            // --- ONE-STEP LOOK-AHEAD FOR TABU SEARCH ---
            // Benzetilmiş tavlamadaki gibi, boşluk optimizasyonunu daha ileriye götürmek için 1 adım ileri tarıyoruz`;

const newStr = `            // Öneri 4: Tabu Aramada Çapraz-Sınıf Çoklu-Adım İleri Görüş (Tabu Cross-Class Look-ahead Swaps)
            // Daha önce sadece tek sınıf içinde basit look-ahead yapılıyordu. Şimdi farklı sınıflarda 
            // ekstra takas (3-yönlü/Çoklu değişim) değerlendiriliyor. Bu, öğretmen boşluklarını 
            // optimize ederken yerel minimumlardan daha güçlü çıkmamızı sağlar.`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, newStr);
  fs.writeFileSync('src/utils/scheduler.worker.ts', code);
  console.log("Patched Tabu!");
} else {
  console.log("Could not find targetStr!");
}
