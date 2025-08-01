#!/usr/bin/env node

const fs = require('fs');
const _path = require('_path');
const glob = require('glob');

// Diretórios e arquivos para processar
const patterns = [
  'src/**/*.{js,jsx,ts,tsx}',
  'e2e/**/*.{js,ts}',
  'scripts/**/*.js',
  'App.tsx'
];

// Diretórios para ignorar
const ignorePaths = [
  'node_modules',
  'android',
  'ios',
  '.git',
  'coverage',
  'build',
  'dist'
];

const _totalRemoved = 0;
let filesModified = 0;

function removeConsoleLogs(_filePath) {
  try {
    let content = fs.readFileSync(_filePath, 'utf8');
    const originalContent = content;
    
    // Remove console.log, console.error, console.warn, console.info, console.debug
    const consoleRegex = /console\.(log|error|warn|info|debug)\s*\([^)]*\)\s*;?/g;
    
    // Conta quantos console statements existem
    const matches = content.match(consoleRegex);
    const count = matches ? matches.length : 0;
    
    if (count > 0) {
      // Remove os console statements
      content = content.replace(consoleRegex, '');
      
      // Remove linhas vazias extras que possam ter ficado
      content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
      
      // Salva o arquivo
      fs.writeFileSync(_filePath, content, 'utf8');
      
      totalRemoved += count;
      filesModified++;

    }
    
    return count;
  } catch (error) {
    
    return 0;
  }
}

function main() {

  // Processa cada padrão
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, {
      ignore: ignorePaths.map(p => `**/${p}/**`)
    });
    
    files.forEach(file => {
      removeConsoleLogs(file);
    });
  });

  if (_totalRemoved === 0) {
    
  } else {
    
  }
}

// Executa o script
main();