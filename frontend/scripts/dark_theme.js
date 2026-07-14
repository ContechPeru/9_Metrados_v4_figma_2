import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.resolve(__dirname, '../src/app/components');

const replacements = [
  // Backgrounds
  { regex: /bg-white/g, replace: 'bg-slate-900' },
  { regex: /bg-gray-50/g, replace: 'bg-slate-800' },
  { regex: /bg-\[\#F8FAFC\]/g, replace: 'bg-slate-800' },
  { regex: /bg-\[\#FAFAFA\]/g, replace: 'bg-slate-950' },
  { regex: /bg-\[\#FCFBF8\]/g, replace: 'bg-slate-950' },
  { regex: /bg-\[\#EEF2FF\]/g, replace: 'bg-slate-700' },
  { regex: /bg-\[\#EEF4FF\]/g, replace: 'bg-slate-700' },
  { regex: /bg-slate-50/g, replace: 'bg-slate-800' },
  { regex: /bg-slate-100/g, replace: 'bg-slate-700' },
  { regex: /bg-blue-50/g, replace: 'bg-blue-900\/30' },
  { regex: /bg-blue-100/g, replace: 'bg-blue-900\/50' },
  { regex: /bg-blue-200/g, replace: 'bg-blue-800\/50' },
  { regex: /bg-red-50/g, replace: 'bg-red-900\/30' },
  
  // Text Colors
  { regex: /text-gray-800/g, replace: 'text-slate-100' },
  { regex: /text-\[\#1A2B45\]/g, replace: 'text-slate-100' },
  { regex: /text-gray-700/g, replace: 'text-slate-200' },
  { regex: /text-gray-600/g, replace: 'text-slate-300' },
  { regex: /text-\[\#5E748A\]/g, replace: 'text-slate-300' },
  { regex: /text-gray-500/g, replace: 'text-slate-400' },
  { regex: /text-gray-400/g, replace: 'text-slate-500' },
  { regex: /text-slate-800/g, replace: 'text-slate-100' },
  { regex: /text-slate-700/g, replace: 'text-slate-200' },
  { regex: /text-slate-600/g, replace: 'text-slate-300' },
  { regex: /text-slate-500/g, replace: 'text-slate-400' },
  
  // Borders
  { regex: /border-gray-200/g, replace: 'border-slate-700\/50' },
  { regex: /border-gray-300/g, replace: 'border-slate-600' },
  { regex: /border-\[\#E5E9F0\]/g, replace: 'border-slate-700\/50' },
  { regex: /border-\[\#DDE3EC\]/g, replace: 'border-slate-700\/50' },
  { regex: /border-\[\#F1F5F9\]/g, replace: 'border-slate-700\/50' },
  { regex: /border-slate-200/g, replace: 'border-slate-700\/50' },
  { regex: /border-slate-300/g, replace: 'border-slate-600' },
  { regex: /border-slate-100/g, replace: 'border-slate-800' },
  
  // Hovers
  { regex: /hover:bg-gray-50/g, replace: 'hover:bg-slate-800' },
  { regex: /hover:bg-white/g, replace: 'hover:bg-slate-700' },
  { regex: /hover:bg-slate-50/g, replace: 'hover:bg-slate-800' },
  { regex: /hover:bg-slate-100/g, replace: 'hover:bg-slate-700' },
  { regex: /hover:bg-\[\#F8FAFC\]/g, replace: 'hover:bg-slate-800' }
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      for (const { regex, replace } of replacements) {
        if (regex.test(content)) {
          content = content.replace(regex, replace);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(targetDir);
console.log('Done replacing colors.');
