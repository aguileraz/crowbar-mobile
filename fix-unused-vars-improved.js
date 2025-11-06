#!/usr/bin/env node

/**
 * Script melhorado para corrigir variáveis não utilizadas
 * Abordagem: Prefixar com _ ao invés de remover
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔍 Analisando erros de variáveis não utilizadas...\n');

// Executar lint e capturar saída
let lintOutput;
try {
  lintOutput = execSync('npm run lint 2>&1', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
} catch (error) {
  lintOutput = error.stdout || error.stderr || '';
}

// Parse dos erros de no-unused-vars (apenas erros, não warnings)
const errorRegex = /^(.+\.tsx?):\s*(\d+):(\d+)\s+error\s+'(.+?)' is (?:defined but never used|assigned a value but never used)/gm;
const matches = [...lintOutput.matchAll(errorRegex)];

if (matches.length === 0) {
  console.log('✅ Nenhum ERRO de variáveis não utilizadas encontrado!');
  process.exit(0);
}

console.log(`📋 Encontrados ${matches.length} ERROS de variáveis não utilizadas\n`);

// Agrupar por arquivo
const fileErrors = new Map();
matches.forEach(match => {
  const [, filePath, line, col, varName] = match;
  if (!fileErrors.has(filePath)) {
    fileErrors.set(filePath, []);
  }
  fileErrors.get(filePath).push({ line: parseInt(line), col: parseInt(col), varName });
});

let totalFixed = 0;
let filesProcessed = 0;

// Processar cada arquivo
for (const [filePath, errors] of fileErrors.entries()) {
  // Ignorar arquivos de teste e e2e
  if (filePath.includes('/e2e/') || filePath.includes('/__tests__/') || filePath.includes('.test.')) {
    console.log(`⏭️  Pulando ${filePath} (test file)`);
    continue;
  }

  // Limitar aos arquivos src/
  if (!filePath.includes('/src/')) {
    console.log(`⏭️  Pulando ${filePath} (não é src/)`);
    continue;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let modified = false;

    console.log(`\n📝 Processando: ${filePath}`);
    console.log(`   Erros: ${errors.length}`);

    // Processar cada erro
    for (const error of errors) {
      const lineIndex = error.line - 1;
      const line = lines[lineIndex];
      const varName = error.varName;

      // Padrão 1: Import não utilizado
      if (line.trim().startsWith('import ')) {
        // Se é um import nomeado { ... }
        const namedImportMatch = line.match(/import\s*{([^}]+)}/);
        if (namedImportMatch) {
          const imports = namedImportMatch[1].split(',').map(i => i.trim());
          const filteredImports = imports.filter(imp => {
            // Remove alias "as" para comparar
            const importName = imp.split(' as ')[0].trim();
            return importName !== varName;
          });

          if (filteredImports.length === 0) {
            // Remover linha inteira se não sobrar nenhum import
            lines[lineIndex] = '';
            modified = true;
            totalFixed++;
            console.log(`     ✓ Removido import completo: ${varName}`);
          } else if (filteredImports.length < imports.length) {
            // Atualizar lista de imports
            const newImportLine = line.replace(namedImportMatch[1], filteredImports.join(', '));
            lines[lineIndex] = newImportLine;
            modified = true;
            totalFixed++;
            console.log(`     ✓ Removido import: ${varName}`);
          }
        }
        // Import default não usado
        else if (line.match(new RegExp(`import\\s+${varName}\\s+from`))) {
          lines[lineIndex] = '';
          modified = true;
          totalFixed++;
          console.log(`     ✓ Removido import default: ${varName}`);
        }
      }

      // Padrão 2: Variável const/let
      else if (line.match(/^\s*(const|let)\s+/) && !line.includes('{')) {
        // Prefixar variável com _
        const regex = new RegExp(`\\b${varName}\\b`);
        if (regex.test(line) && !varName.startsWith('_')) {
          lines[lineIndex] = line.replace(regex, `_${varName}`);
          modified = true;
          totalFixed++;
          console.log(`     ✓ Prefixado com _: ${varName}`);
        }
      }

      // Padrão 3: Desestruturação { var1, var2 }
      else if (line.includes('{') && line.includes('}') && line.includes('=')) {
        const regex = new RegExp(`\\b${varName}\\b`);
        if (regex.test(line) && !varName.startsWith('_')) {
          lines[lineIndex] = line.replace(regex, `_${varName}`);
          modified = true;
          totalFixed++;
          console.log(`     ✓ Prefixado na desestruturação: ${varName}`);
        }
      }

      // Padrão 4: Parâmetros de função/arrow function
      else if (line.includes('=>') || line.includes('function') || line.includes('.catch(') || line.includes('.then(')) {
        const regex = new RegExp(`\\b${varName}\\b`);
        if (regex.test(line) && !varName.startsWith('_')) {
          lines[lineIndex] = line.replace(regex, `_${varName}`);
          modified = true;
          totalFixed++;
          console.log(`     ✓ Prefixado parâmetro: ${varName}`);
        }
      }
    }

    if (modified) {
      // Limpar linhas vazias consecutivas de imports
      let cleaned = lines.join('\n');
      cleaned = cleaned.replace(/(\nimport[^\n]*\n)\n+/g, '$1');
      cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

      fs.writeFileSync(filePath, cleaned, 'utf-8');
      filesProcessed++;
      console.log(`   ✅ Arquivo salvo com ${errors.length} correções`);
    } else {
      console.log(`   ⚠️  Nenhuma modificação aplicada`);
    }
  } catch (error) {
    console.error(`   ❌ Erro ao processar: ${error.message}`);
  }
}

console.log(`\n✨ Processo concluído!`);
console.log(`📁 Arquivos processados: ${filesProcessed}`);
console.log(`🔧 Erros corrigidos: ${totalFixed}`);
console.log(`\n🧪 Execute 'npm run lint' para verificar resultados`);
