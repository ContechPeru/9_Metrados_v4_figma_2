const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const excelPath = path.resolve(__dirname, '../../liberado_marz.xlsx');
const wb = XLSX.readFile(excelPath);
console.log('Sheet names in liberado_marz.xlsx:', wb.SheetNames);

for (const name of wb.SheetNames) {
  const sheet = wb.Sheets[name];
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
  console.log(`Sheet "${name}" rows: ${rows.length}`);

  let arqCount = 0;
  let totalData = 0;
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) continue;
    const partida = String(r[12] || r[6] || '').trim();
    if (partida.startsWith('OE.3')) arqCount++;
    if (partida.startsWith('OE.')) totalData++;
  }
  console.log(`Sheet "${name}": total OE data rows=${totalData}, OE.3 (Arquitectura)=${arqCount}`);
}
