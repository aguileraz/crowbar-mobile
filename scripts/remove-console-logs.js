#!/usr/bin/env node

/**
 * Script para remover console.log statements do código de produção
 * Preserva: 
 * - loggerService.ts (serviço de logging oficial)
 * - Arquivos de teste
 * - console.error e console.warn (podem ser importantes)
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Padrões para ignorar
const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/__tests__/**',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/loggerService.ts',
  '**/*.spec.ts',
  '**/*.spec.tsx',
];

// Regex para encontrar console.log, console.debug, console.info
const CONSOLE_LOG_REGEX = /console\.(log|debug|info)\([^)]*\);?/g;
const MULTILINE_CONSOLE_REGEX = /console\.(log|debug|info)\([^;]*\);/gs;

function removeConsoleLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Remove console.log statements simples
    content = content.replace(CONSOLE_LOG_REGEX, '');
    
    // Remove console.log statements multiline
    content = content.replace(MULTILINE_CONSOLE_REGEX, (match) => {
      // Preserva console.error e console.warn
      if (match.includes('console.error') || match.includes('console.warn')) {
        return match;
      }
      return '';
    });
    
    // Remove linhas vazias extras criadas pela remoção
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Erro ao processar ${filePath}:`, error);
    return false;
  }
}

function main() {
  const srcPath = path.join(__dirname, '..', 'src');
  
  // Encontra todos os arquivos TypeScript/TSX
  const files = glob.sync('**/*.{ts,tsx}', {
    cwd: srcPath,
    ignore: IGNORE_PATTERNS,
    absolute: true,
  });
  
  console.log(`Processando ${files.length} arquivos...`);
  
  let modifiedCount = 0;
  files.forEach((file) => {
    if (removeConsoleLogs(file)) {
      modifiedCount++;
      console.log(`✓ Limpo: ${path.relative(srcPath, file)}`);
    }
  });
  
  console.log(`\n✨ Completo! ${modifiedCount} arquivos modificados.`);
  
  // Adiciona comentário em loggerService para usar em produção
  const loggerServicePath = path.join(srcPath, 'services', 'loggerService.ts');
  if (fs.existsSync(loggerServicePath)) {
    let loggerContent = fs.readFileSync(loggerServicePath, 'utf8');
    if (!loggerContent.includes('// Production logging service')) {
      loggerContent = '// Production logging service - Use this instead of console.log\n' + loggerContent;
      fs.writeFileSync(loggerServicePath, loggerContent, 'utf8');
      console.log('✓ LoggerService marcado para uso em produção');
    }
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { removeConsoleLogs };