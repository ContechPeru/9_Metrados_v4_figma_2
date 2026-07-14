const xlsx = require('xlsx');

const filePath = 'C:\\\\Users\\\\Legion\\\\Downloads\\\\Valorizaciones - Acum. Junio 2026 - Jorge sin deductivos.xlsx';
const workbook = xlsx.readFile(filePath);

const sheetName = 'Compilado de modificaciones';
if (!workbook.Sheets[sheetName]) {
  console.log(`Sheet "${sheetName}" not found.`);
  process.exit(1);
}

const worksheet = workbook.Sheets[sheetName];
const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 }); // read as array of arrays

if (jsonData.length === 0) {
  console.log("Empty sheet");
  process.exit(1);
}

// Print the first 5 rows to understand the structure
for (let i = 0; i < Math.min(5, jsonData.length); i++) {
  console.log(`Row ${i}:`, jsonData[i]);
}

// Find column BH which is index 59 (0-indexed: A=0, B=1, ... AA=26, BA=52, BH=59)
console.log('---');
console.log('Column BH header (Row 0, index 59):', jsonData[0][59]);
console.log('Column BH header (Row 1, index 59):', jsonData[1] ? jsonData[1][59] : 'undefined');
