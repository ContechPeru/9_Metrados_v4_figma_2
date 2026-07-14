const xlsx = require('xlsx');

const filePath = 'C:\\\\Users\\\\Legion\\\\Downloads\\\\Valorizaciones - Acum. Junio 2026 - Jorge sin deductivos.xlsx';
const workbook = xlsx.readFile(filePath);

const sheetName = 'Compilado de modificaciones';
if (!workbook.Sheets[sheetName]) {
  console.log(`Sheet "${sheetName}" not found.`);
  process.exit(1);
}

const worksheet = workbook.Sheets[sheetName];
const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

for (let i = 0; i < 15; i++) {
  if (jsonData[i]) {
     console.log(`Row ${i} length: ${jsonData[i].length}`);
     if (jsonData[i][59]) {
        console.log(`Row ${i} col BH (59) = ${jsonData[i][59]}`);
     }
  }
}

// Print some data from row 5-10
for(let r=5; r<10; r++) {
    if(!jsonData[r]) continue;
    console.log(`Row ${r}: ITEM=${jsonData[r][0]} DESC=${jsonData[r][1]} UND=${jsonData[r][2]} MOD(59)=${jsonData[r][59]}`);
}
