const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const excelPath = path.resolve(__dirname, '../../liberado_marz.xlsx');
const wb = XLSX.readFile(excelPath);
const sheet = wb.Sheets[wb.SheetNames[0]];
console.log('Original !ref in liberado_marz.xlsx:', sheet['!ref']);

const rowsDefault = XLSX.utils.sheet_to_json(sheet, { header: 1 });
console.log('Default rows parsed:', rowsDefault.length);

const keys = Object.keys(sheet).filter(k => !k.startsWith('!'));
let maxR = 0;
let maxC = 0;
for (const k of keys) {
  const decoded = XLSX.utils.decode_cell(k);
  if (decoded.r > maxR) maxR = decoded.r;
  if (decoded.c > maxC) maxC = decoded.c;
}
sheet['!ref'] = `A1:${XLSX.utils.encode_cell({ r: maxR, c: Math.min(maxC, 30) })}`;
const rowsFull = XLSX.utils.sheet_to_json(sheet, { header: 1 });
console.log('Full rows with updated ref:', rowsFull.length);
console.log('Max row in sheet:', maxR);
