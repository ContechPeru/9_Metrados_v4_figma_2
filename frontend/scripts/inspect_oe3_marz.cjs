const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const excelPath = path.resolve(__dirname, '../../liberado_marz.xlsx');
const wb = XLSX.readFile(excelPath);
const sheet = wb.Sheets[wb.SheetNames[0]];

const keys = Object.keys(sheet).filter(k => !k.startsWith('!'));
let maxR = 0;
let maxC = 0;
for (const k of keys) {
  const decoded = XLSX.utils.decode_cell(k);
  if (decoded.r > maxR) maxR = decoded.r;
  if (decoded.c > maxC) maxC = decoded.c;
}
sheet['!ref'] = `A1:${XLSX.utils.encode_cell({ r: maxR, c: Math.min(maxC, 30) })}`;
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('Finding rows with OE.3...');
for (let i = 7; i < rows.length; i++) {
  const r = rows[i];
  if (!r) continue;
  for (let c = 0; c < r.length; c++) {
    if (r[c] && String(r[c]).includes('OE.3')) {
      console.log(`Found OE.3 at row ${i}, col ${c}: "${r[c]}"`);
      console.log('Full row:', JSON.stringify(r));
      break;
    }
  }
  if (i > 300) break;
}
