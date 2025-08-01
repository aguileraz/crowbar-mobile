#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const _glob = require('glob');

// Padrões conhecidos de erros de parsing e suas correções
const parsingFixes = {
  // Log functions incompletas
  'info: (msg) => ,': 'info: (msg) => console.log(`ℹ️  ${msg}`),',
  'success: (msg) => ,': 'success: (msg) => console.log(`✅ ${msg}`),',
  'warning: (msg) => ,': 'warning: (msg) => console.log(`⚠️  ${msg}`),',
  'error: (msg) => ,': 'error: (msg) => console.error(`❌ ${msg}`),',
  'title: (msg) => ,': 'title: (msg) => console.log(`\\n📦 ${msg}\\n${\'=\'.repeat(40)}`),',
  
  // Template literals incompletos
  '.toISOString()}: ${message}`);': 'console.log(`[E2E Test ${new Date().toISOString()}]: ${message}`);',
  
  // Expressões incompletas
  'Expression expected': ''
};

// Função para corrigir erros de parsing específicos por arquivo
function fixFileSpecificErrors(content, _filePath) {
  const fileName = path.basename(_filePath);
  let modified = false;
  let processedContent = content;
  
  // Correções específicas para cada arquivo
  switch (fileName) {
    case 'api-connectivity-test.js':
    case 'build-production.js':
    case 'configure-production-env.js':
    case 'deploy-backend.js':
    case 'device-test-runner.js':
    case 'final-build-validation.js':
      // Estes arquivos têm problemas com log functions
      if (processedContent.includes('info: (msg) => ,')) {
        processedContent = processedContent.replace(
          /const log = \{[\s\S]*?\};/,
          `const log = {
  info: (msg) => console.log(\`ℹ️  \${msg}\`),
  success: (msg) => console.log(\`✅ \${msg}\`),
  warning: (msg) => console.log(\`⚠️  \${msg}\`),
  error: (msg) => console.error(\`❌ \${msg}\`),
  title: (msg) => console.log(\`\\n📦 \${msg}\\n\${'='.repeat(40)}\`),
};`
        );
        modified = true;
      }
      break;
      
    case 'final-comprehensive-fix.js':
      // Template literal não terminado
      if (processedContent.includes('Unterminated template literal')) {
        const lines = processedContent.split('\n');
        // Procura por template literals incompletos
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('`') && !lines[i].includes('`', lines[i].indexOf('`') + 1)) {
            // Adiciona o fechamento do template literal
            lines[i] = lines[i] + '`';
            modified = true;
          }
        }
        processedContent = lines.join('\n');
      }
      break;
      
    case 'clean-console-advanced.js':
      // Problema com ponto e vírgula esperado
      const semiColonRegex = /(\w+)\s*\n\s*\./g;
      if (semiColonRegex.test(processedContent)) {
        processedContent = processedContent.replace(semiColonRegex, '$1;');
        modified = true;
      }
      break;
      
    case 'loggerService.ts':
      // Erro de parsing específico deste arquivo
      if (processedContent.includes('Parsing error')) {
        // Verifica se há problemas com fechamento de blocos
        const openBraces = (processedContent.match(/\{/g) || []).length;
        const closeBraces = (processedContent.match(/\}/g) || []).length;
        if (openBraces > closeBraces) {
          processedContent += '\n}'.repeat(openBraces - closeBraces);
          modified = true;
        }
      }
      break;
  }
  
  // Aplicar correções genéricas
  for (const [pattern, replacement] of Object.entries(parsingFixes)) {
    if (processedContent.includes(pattern)) {
      processedContent = processedContent.replace(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
      modified = true;
    }
  }
  
  return {
    content: processedContent,
    modified
  };
}

// Função principal
async function main() {
  const filesWithParsingErrors = [
    'scripts/analyze-bundle.js',
    'scripts/api-connectivity-test.js',
    'scripts/build-production.js',
    'scripts/clean-console-advanced.js',
    'scripts/configure-production-env.js',
    'scripts/deploy-backend.js',
    'scripts/device-test-runner.js',
    'scripts/final-build-validation.js',
    'scripts/final-comprehensive-fix.js',
    'src/services/loggerService.ts'
  ];
  
  let _totalFiles = 0;
  let totalFixes = 0;
  
  for (const relativePath of filesWithParsingErrors) {
    const _filePath = path.join(process.cwd(), relativePath);
    
    try {
      if (!fs.existsSync(_filePath)) {
        console.log(`⚠️  Arquivo não encontrado: ${relativePath}`);
        continue;
      }
      
      const content = fs.readFileSync(_filePath, 'utf8');
      const result = fixFileSpecificErrors(content, _filePath);
      
      if (result.modified) {
        fs.writeFileSync(_filePath, result.content);
        _totalFiles++;
        totalFixes++;
        console.log(`✓ Corrigido: ${relativePath}`);
      }
    } catch (error) {
      console.error(`✗ Erro ao processar ${relativePath}:`, error.message);
    }
  }
  
  console.log(`\n✅ Concluído! ${_totalFiles} arquivos modificados, ${totalFixes} correções aplicadas.`);
}

// Executar
main().catch(console.error);