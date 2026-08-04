const fs = require('fs');
const lines = fs.readFileSync('src/lib/i18n.test.ts', 'utf8').split('\n');
const line = lines[132];
const fixed = line.replace(/toBe\('(.+?)'\)/, "toBe('\\u0410\\u0430\\u0440\\u0432\\u0432')");
lines[132] = fixed;
fs.writeFileSync('src/lib/i18n.test.ts', lines.join('\n'));
console.log('Fixed');
