const fs = require('fs');
let file = fs.readFileSync('src/app/types/database.types.ts', 'utf8');

const tables = [
  'catalogo_partidas',
  'registro_metrados',
  'personal_obrero',
  'especialidades',
  'cuadrillas',
  'obreros_cuadrillas',
  'usuarios_sistema'
];

for (const table of tables) {
  // Find where the table ends (the closing brace for the table object)
  // This is tricky with regex, so we'll just insert Relationships if not exists
  const regex = new RegExp(`(${table}:\\s*\\{[\\s\\S]*?)(?=\\n\\s*\\w+: \\{|\\n\\s*\\}\\n\\s*Views:)`);
  file = file.replace(regex, (match, p1) => {
    let newMatch = p1;
    if (!newMatch.includes('Insert:')) {
      newMatch += `\n        Insert: Partial<Database['public']['Tables']['${table}']['Row']>\n`;
    }
    if (!newMatch.includes('Update:')) {
      newMatch += `\n        Update: Partial<Database['public']['Tables']['${table}']['Row']>\n`;
    }
    if (!newMatch.includes('Relationships:')) {
      newMatch += `\n        Relationships: any[]\n`;
    }
    return newMatch;
  });
}

fs.writeFileSync('src/app/types/database.types.ts', file);
