const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const excelPath = path.resolve(__dirname, '../../liberado_junio.xlsx');
const wb = XLSX.readFile(excelPath);
const sheet = wb.Sheets[wb.SheetNames[0]];
console.log('Original !ref:', sheet['!ref']);

// Let's find the true used range by checking keys
const keys = Object.keys(sheet).filter(k => !k.startsWith('!'));
let maxR = 0;
let maxC = 0;

for (const k of keys) {
  const decoded = XLSX.utils.decode_cell(k);
  if (decoded.r > maxR) maxR = decoded.r;
  if (decoded.c > maxC) maxC = decoded.c;
}

console.log(`True used range: 0,0 to ${maxR},${maxC}`);
console.log(`Formatted ref: A1:${XLSX.utils.encode_cell({ r: maxR, c: Math.min(maxC, 30) })}`);

sheet['!ref'] = `A1:${XLSX.utils.encode_cell({ r: maxR, c: Math.min(maxC, 30) })}`;
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
console.log(`Total rows parsed: ${rows.length}`);

for (let r = 0; r <= 10; r++) {
  if (rows[r]) {
    console.log(`Row ${r} (len ${rows[r].length}):`, JSON.stringify(rows[r].slice(0, 25)));
  }
}
