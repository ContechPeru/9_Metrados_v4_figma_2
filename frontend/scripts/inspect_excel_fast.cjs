const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const excelPath = path.resolve(__dirname, '../../liberado_junio.xlsx');
console.log('Loading workbook...');
const wb = XLSX.readFile(excelPath, { dense: true, cellDates: true });
console.log('Workbook loaded. Sheet names:', wb.SheetNames);
const sheet = wb.Sheets[wb.SheetNames[0]];
console.log('Sheet ref:', sheet['!ref']);

const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
console.log('Total rows parsed:', rows.length);

for (let i = 0; i < Math.min(15, rows.length); i++) {
  console.log(`Row ${i}:`, JSON.stringify(rows[i]));
}
