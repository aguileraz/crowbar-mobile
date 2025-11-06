#!/usr/bin/env node

/**
 * Script para remover imports e variáveis não utilizadas
 * Baseado nos erros do ESLint
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔍 Analisando erros de variáveis não utilizadas...\n');

// Executar lint e capturar saída
let lintOutput;
try {
  lintOutput = execSync('npm run lint 2>&1', { encoding: 'utf-8' });
} catch (error) {
  lintOutput = error.stdout || error.stderr || '';
}

// Parse dos erros de no-unused-vars
const unusedVarsRegex = /^(.+\.tsx?):(\d+):(\d+)\s+error\s+'(.+?)' is (?:defined but never used|assigned a value but never used)\./gm;
const matches = [...lintOutput.matchAll(unusedVarsRegex)];

if (matches.length === 0) {
  console.log('✅ Nenhum erro de variáveis não utilizadas encontrado!');
  process.exit(0);
}

console.log(`📋 Encontrados ${matches.length} erros de variáveis não utilizadas\n`);

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
  // Ignorar arquivos de teste e e2e por enquanto
  if (filePath.includes('/e2e/') || filePath.includes('/__tests__/') || filePath.includes('.test.')) {
    console.log(`⏭️  Pulando ${filePath} (test file)`);
    continue;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let modified = false;

    // Ordenar erros por linha (decrescente) para não afetar números de linha
    errors.sort((a, b) => b.line - a.line);

    for (const error of errors) {
      const lineIndex = error.line - 1;
      const line = lines[lineIndex];

      // Caso 1: Import não utilizado simples
      if (line.match(/^import .+ from/)) {
        const importMatch = line.match(/import\s+{([^}]+)}/);
        if (importMatch) {
          const imports = importMatch[1].split(',').map(i => i.trim());
          const filteredImports = imports.filter(i => {
            const varName = i.split(' as ')[0].trim();
            return !errors.some(e => e.varName === varName);
          });

          if (filteredImports.length === 0) {
            // Remover linha inteira
            lines[lineIndex] = '';
            modified = true;
            totalFixed++;
          } else if (filteredImports.length < imports.length) {
            // Atualizar imports
            lines[lineIndex] = line.replace(importMatch[1], filteredImports.join(', '));
            modified = true;
            totalFixed++;
          }
        } else if (line.match(/^import\s+\w+\s+from/) && line.includes(error.varName)) {
          // Import default não utilizado
          lines[lineIndex] = '';
          modified = true;
          totalFixed++;
        }
      }

      // Caso 2: Variável const/let não utilizada e não faz parte de desestruturação
      else if (line.match(/^\s*const\s+/) || line.match(/^\s*let\s+/)) {
        // Se é uma desestruturação simples, prefixar com _
        if (line.includes(' = ') && !line.includes('{')) {
          const varRegex = new RegExp(`\\b${error.varName}\\b`);
          if (varRegex.test(line)) {
            lines[lineIndex] = line.replace(varRegex, `_${error.varName}`);
            modified = true;
            totalFixed++;
          }
        }
      }
    }

    if (modified) {
      // Remover linhas vazias consecutivas de imports
      let cleaned = lines.join('\n');
      cleaned = cleaned.replace(/(\nimport[^\n]*\n)\n+/g, '$1');
      cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

      fs.writeFileSync(filePath, cleaned, 'utf-8');
      filesProcessed++;
      console.log(`✅ ${filePath} - ${errors.length} erros processados`);
    }
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
  }
}

console.log(`\n✨ Processo concluído!`);
console.log(`📁 Arquivos processados: ${filesProcessed}`);
console.log(`🔧 Erros corrigidos: ${totalFixed}`);
console.log(`\n🧪 Execute 'npm run lint' para verificar resultados`);
