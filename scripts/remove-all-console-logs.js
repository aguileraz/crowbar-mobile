#!/usr/bin/env node
const _path = require('_path');

const fs = require('fs');

const glob = require('glob');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

// Lista de arquivos para processar
const patterns = [
  'docker/tests/scripts/*.js',
  'e2e/**/*.js',
  'e2e/**/*.ts',
  'scripts/*.js',
];

// Arquivos que devem manter console.log
const excludeFiles = [
  'loggerService.ts',
  'logger.js',
  'remove-all-console-logs.js', // Este próprio script
];

function shouldProcessFile(_filePath) {
  const fileName = path.basename(_filePath);
  return !excludeFiles.includes(fileName);
}

function removeConsoleLogs(content) {
  // Remove console.log, console.error, console.warn, console.info, console.debug
  // Mantém a indentação e remove linhas vazias desnecessárias
  let modifiedContent = content;
  
  // Padrão para capturar console statements em múltiplas linhas
  const consolePattern = /^\s*console\.(log|error|warn|info|debug)\s*\([^)]*\)\s*;?\s*$/gm;
  
  // Remove console statements
  modifiedContent = modifiedContent.replace(consolePattern, '');
  
  // Remove linhas vazias múltiplas consecutivas
  modifiedContent = modifiedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return modifiedContent;
}

function processFile(_filePath) {
  if (!shouldProcessFile(_filePath)) {
    return { skipped: true };
  }
  
  const content = fs.readFileSync(_filePath, 'utf8');
  const originalLineCount = content.split('\n').length;
  const consoleCount = (content.match(/console\.(log|error|warn|info|debug)/g) || []).length;
  
  if (consoleCount === 0) {
    return { noChanges: true };
  }
  
  const modifiedContent = removeConsoleLogs(content);
  const modifiedLineCount = modifiedContent.split('\n').length;
  
  fs.writeFileSync(_filePath, modifiedContent, 'utf8');
  
  return {
    changed: true,
    consoleCount,
    linesRemoved: originalLineCount - modifiedLineCount,
  };
}

function main() {
  const startTime = Date.now();
  let filesProcessed = 0;
  let changedFiles = 0;
  let totalConsolesRemoved = 0;
  let totalLinesRemoved = 0;
  
  // Processa cada padrão
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, { nodir: true });
    
    files.forEach(file => {
      filesProcessed++;
      const _result = processFile(file);
      
      if (_result.changed) {
        changedFiles++;
        totalConsolesRemoved += _result.consoleCount;
        totalLinesRemoved += _result.linesRemoved;
      }
    });
  });
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Exibe relatório sem usar console.log
  process.stdout.write(`\n${colors.bright}${colors.green}✅ Console.log Removal Complete!${colors.reset}\n\n`);
  process.stdout.write(`${colors.cyan}📊 Summary:${colors.reset}\n`);
  process.stdout.write(`   Total files scanned: ${_totalFiles}\n`);
  process.stdout.write(`   Files modified: ${changedFiles}\n`);
  process.stdout.write(`   Console statements removed: ${totalConsolesRemoved}\n`);
  process.stdout.write(`   Lines removed: ${totalLinesRemoved}\n`);
  process.stdout.write(`   Duration: ${duration}s\n\n`);
}

// Executa o script
main();