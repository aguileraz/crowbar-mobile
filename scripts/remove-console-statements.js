#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Função para remover console statements de forma segura
function removeConsoleStatements(content) {
  // Remove console.log, console.error, console.warn, console.info, console.debug
  // Mas preserva linhas que contenham 'console' em strings ou comentários
  const lines = content.split('\n');
  const processedLines = lines.map(line => {
    // Pula se for comentário
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      return line;
    }
    
    // Remove console statements preservando a indentação
    const match = line.match(/^(\s*)console\.(log|error|warn|info|debug)\s*\(/);
    if (match) {
      const indent = match[1];
      // Verifica se é uma linha multi-linha
      const openParens = (line.match(/\(/g) || []).length;
      const closeParens = (line.match(/\)/g) || []).length;
      
      if (openParens === closeParens) {
        // Statement completo em uma linha - remove completamente
        return '';
      } else {
        // Multi-linha - marca para processamento manual
        return `${indent}// TODO: Remove multi-line console statement`;
      }
    }
    
    return line;
  });
  
  // Remove linhas vazias extras
  return processedLines
    .filter((line, index, array) => {
      // Mantém a linha se não for vazia ou se a próxima linha não for vazia
      return line !== '' || (array[index + 1] && array[index + 1] !== '');
    })
    .join('\n');
}

// Função principal
async function main() {
  const patterns = [
    'src/**/*.{js,jsx,ts,tsx}',
    'scripts/**/*.js',
    'e2e/**/*.{js,ts}',
    'App.tsx'
  ];
  
  const excludePatterns = [
    '**/node_modules/**',
    '**/build/**',
    '**/dist/**',
    '**/__tests__/**',
    '**/test/**',
    '**/loggerService.ts', // Não remove de serviços de log
    '**/scripts/remove-console*.js' // Não remove deste próprio script
  ];
  
  let totalFiles = 0;
  let totalRemoved = 0;
  
  for (const pattern of patterns) {
    const files = glob.sync(pattern, {
      ignore: excludePatterns,
      absolute: true
    });
    
    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const originalLineCount = content.split('\n').length;
        
        const processedContent = removeConsoleStatements(content);
        const newLineCount = processedContent.split('\n').length;
        
        if (content !== processedContent) {
          fs.writeFileSync(filePath, processedContent);
          const removed = originalLineCount - newLineCount;
          totalRemoved += removed;
          totalFiles++;
          console.log(`✓ Processado: ${path.relative(process.cwd(), filePath)} (${removed} linhas removidas)`);
        }
      } catch (error) {
        console.error(`✗ Erro ao processar ${filePath}:`, error.message);
      }
    }
  }
  
  console.log(`\n✅ Concluído! ${totalFiles} arquivos modificados, ${totalRemoved} linhas removidas.`);
}

// Executar
main().catch(console.error);