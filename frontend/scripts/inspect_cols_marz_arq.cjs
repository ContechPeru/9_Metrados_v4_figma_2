const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function parseExcelDate(excelDate) {
  if (!excelDate) return null;
  if (typeof excelDate === 'number') {
    const parsed = XLSX.SSF.parse_date_code(excelDate);
    if (parsed) {
      const yyyy = parsed.y;
      const mm = String(parsed.m).padStart(2, '0');
      const dd = String(parsed.d).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  }
  const str = String(excelDate).trim();
  if (str.includes('/')) {
    const [d, m, y] = str.split('/');
    if (y && m && d) return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return str || null;
}

const excelPath = path.resolve(__dirname, '../../liberado_marz_arq.xlsx');
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

console.log('Sample rows with TOTAL, TOTAL 2, MODIF, etc.:');
for (let i = 1; i <= 20; i++) {
  console.log(`Row ${i}:`, {
    fecha: parseExcelDate(rows[i][1]),
    grado: rows[i][0],
    esp: rows[i][2],
    frente: rows[i][3],
    bloque: rows[i][4],
    nivel: rows[i][5],
    partida: rows[i][7]?.slice(0, 30),
    desc: rows[i][8],
    total: rows[i][9],
    total2: rows[i][10],
    und: rows[i][11],
    modif: rows[i][12],
    col13: rows[i][13]
  });
}

// Let's check non-empty TOTAL 2 count
let total2Count = 0;
let col13Count = 0;
for (let i = 1; i < rows.length; i++) {
  if (rows[i][10] !== undefined && rows[i][10] !== null && rows[i][10] !== '') total2Count++;
  if (rows[i][13] !== undefined && rows[i][13] !== null && rows[i][13] !== '') col13Count++;
}
console.log(`\nRows with TOTAL 2: ${total2Count} / ${rows.length - 1}`);
console.log(`Rows with Col 13: ${col13Count} / ${rows.length - 1}`);
