const XLSX = require('xlsx');

function auditExcel() {
  const filePath = 'C:\\Users\\Legion\\Downloads\\CORREGIDO_HOSPI.xlsx';
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Read the raw JSON data without assuming a header row
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log(`\n=== AUDIT DE EXCEL ===`);
    console.log(`Total de filas detectadas: ${data.length}`);
    console.log(`\nPrimeras 10 filas (para analizar encabezados y datos):`);
    
    for (let i = 0; i < Math.min(10, data.length); i++) {
      console.log(`Fila ${i + 1}:`, data[i]);
    }
    
    // Check missing columns (specifically Especialidad)
    console.log(`\nAnálisis de columnas basado en tu solicitud:`);
    console.log(`Columna A (Índice 0): Item_WBS`);
    console.log(`Columna B (Índice 1): Descripcion`);
    console.log(`Columna C (Índice 2): Unidad`);
    console.log(`Columna D (Índice 3): Metrado_Presupuestado`);
    console.log(`Columna E (Índice 4): Precio_Unitario_Base`);
    console.log(`Columna F (Índice 5): Metrado_Presupuestado (¿Repetido?)`);
    console.log(`Columna G (Índice 6): Modificacion`);
    console.log(`Columna H (Índice 7): Metrado_Ejecutado_Anterior`);

  } catch (error) {
    console.error("Error al leer el archivo Excel:", error.message);
  }
}

auditExcel();
