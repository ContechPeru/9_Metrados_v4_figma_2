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

console.log('Total rows in sheet:', rows.length);

let totalValid = 0;
let arqRows = 0;
let structRows = 0;
let skipped = 0;

for (let i = 7; i < rows.length; i++) {
  const r = rows[i];
  if (!r || r.length === 0 || r.every(c => c === undefined || c === null || c === '')) {
    skipped++;
    continue;
  }
  const rawPartida = r[12] ? String(r[12]).trim() : '';
  if (!rawPartida || rawPartida.startsWith('METRADO CORRESPONDIENTE')) {
    skipped++;
    continue;
  }

  totalValid++;
  if (rawPartida.startsWith('OE.3')) arqRows++;
  else if (rawPartida.startsWith('OE.2')) structRows++;
}

console.log(`Total valid data rows: ${totalValid}`);
console.log(`Arquitectura (OE.3): ${arqRows}`);
console.log(`Estructuras (OE.2): ${structRows}`);
console.log(`Skipped rows: ${skipped}`);
