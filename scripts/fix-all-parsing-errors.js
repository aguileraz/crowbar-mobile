#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Lista de arquivos com erros de parsing e suas correções
const filesToFix = [
  {
    file: 'scripts/analyze-bundle.js',
    fixes: [
      { line: 591, fix: '    console.log("");' },
      { line: 593, fix: '    console.log(`Analysis complete for ${platform}`)' },
      { line: 609, fix: '    console.log("");' },
    ]
  },
  {
    file: 'scripts/api-connectivity-test.js',
    fixes: [
      { line: 289, fix: '}' }, // Fechamento de função
    ]
  },
  {
    file: 'scripts/build-production.js',
    fixes: [
      { line: 366, fix: '}' }, // Fechamento de função
    ]
  },
  {
    file: 'scripts/clean-console-advanced.js',
    fixes: [
      { line: 128, fix: '        console.log(`✓ ${path.relative(process.cwd(), file)}: ${count} console statements commented`);' },
    ]
  },
  {
    file: 'scripts/configure-production-env.js',
    fixes: [
      { line: 192, fix: '      console.log(`Updated ${file}`)' },
    ]
  },
  {
    file: 'scripts/deploy-backend.js',
    fixes: [
      { line: 555, fix: '  }' }, // Fechamento de função
    ]
  },
  {
    file: 'scripts/device-test-runner.js',
    fixes: [
      { line: 478, fix: '}' }, // Fechamento de função
    ]
  },
  {
    file: 'scripts/final-build-validation.js',
    fixes: [
      { line: 363, fix: '}' }, // Fechamento de função
    ]
  },
  {
    file: 'scripts/fix-unused-vars.js',
    fixes: [
      { line: 102, fix: '      totalFiles++;' },
    ]
  },
  {
    file: 'scripts/generate-store-assets.js',
    fixes: [
      { line: 74, fix: '  console.log(`Generating store assets...`);' },
    ]
  },
  {
    file: 'scripts/manage-environments.js',
    fixes: [
      { line: 32, fix: '  console.log(`Managing environments...`);' },
    ]
  },
  {
    file: 'scripts/optimize-assets.js',
    fixes: [
      { line: 57, fix: '  console.log(`Optimizing assets...`);' },
    ]
  },
  {
    file: 'scripts/optimize-performance.js',
    fixes: [
      { line: 46, fix: '  console.log(`Optimizing performance...`);' },
    ]
  },
];

// Função para aplicar correções em um arquivo
function fixFile(filePath, fixes) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Ordena fixes por linha (decrescente) para não afetar índices
    fixes.sort((a, b) => b.line - a.line);
    
    fixes.forEach(({ line, fix }) => {
      const lineIndex = line - 1; // Converter para índice base 0
      
      if (lineIndex >= 0 && lineIndex < lines.length) {
        // Se a linha está vazia ou tem apenas espaços, substitui
        if (lines[lineIndex].trim() === '' || 
            lines[lineIndex].includes(');') && lines[lineIndex].trim().length === 2) {
          lines[lineIndex] = fix;
        }
        // Se tem um template literal incompleto
        else if (lines[lineIndex].includes('`);') || lines[lineIndex].includes('}`);')) {
          lines[lineIndex] = fix;
        }
        // Se tem expressão incompleta
        else if (lines[lineIndex].match(/^\s*\);?\s*$/)) {
          lines[lineIndex] = fix;
        }
        // Se tem incremento malformado
        else if (lines[lineIndex].includes('0++;')) {
          lines[lineIndex] = lines[lineIndex].replace('0++', 'totalFiles++');
        }
      }
    });
    
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log(`✓ Corrigido: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`✗ Erro ao corrigir ${filePath}:`, error.message);
    return false;
  }
}

// Função principal
function main() {
  console.log('🔧 Corrigindo erros de parsing...\n');
  
  let totalFixed = 0;
  let totalErrors = 0;
  
  filesToFix.forEach(({ file, fixes }) => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      if (fixFile(filePath, fixes)) {
        totalFixed++;
      } else {
        totalErrors++;
      }
    } else {
      console.log(`⚠️  Arquivo não encontrado: ${file}`);
      totalErrors++;
    }
  });
  
  console.log(`\n✅ Concluído! ${totalFixed} arquivos corrigidos, ${totalErrors} erros.`);
  
  // Executa lint para verificar se ainda há erros
  console.log('\n📊 Verificando resultado...');
  try {
    const { execSync } = require('child_process');
    const result = execSync('npm run lint 2>&1 | grep -c "Parsing error"', { encoding: 'utf8' });
    console.log(`Erros de parsing restantes: ${result.trim()}`);
  } catch (error) {
    console.log('Erros de parsing resolvidos ou lint ainda tem outros erros.');
  }
}

// Executar
main();