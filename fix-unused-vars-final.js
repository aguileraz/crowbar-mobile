#!/usr/bin/env node

/**
 * Script final para corrigir variáveis não utilizadas
 * Usa output JSON do ESLint para precisão
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔍 Analisando erros com ESLint JSON output...\n');

// Executar ESLint com formato JSON
let eslintOutput;
try {
  execSync('npx eslint src/ --format json --no-color > /tmp/eslint-results.json 2>&1', {
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024
  });
} catch (error) {
  // ESLint retorna exit code != 0 quando há erros, mas ainda gera o JSON
}

// Ler resultados
const results = JSON.parse(fs.readFileSync('/tmp/eslint-results.json', 'utf-8'));

// Processar cada arquivo
let totalFixed = 0;
let filesProcessed = 0;

for (const result of results) {
  const filePath = result.filePath;

  // Filtrar apenas erros de no-unused-vars (severity 2 = error)
  const unusedVarsErrors = result.messages.filter(m =>
    m.ruleId === '@typescript-eslint/no-unused-vars' && m.severity === 2
  );

  if (unusedVarsErrors.length === 0) continue;

  // Ignorar arquivos de teste
  if (filePath.includes('/__tests__/') || filePath.includes('.test.') || filePath.includes('/e2e/')) {
    continue;
  }

  console.log(`\n📝 ${filePath}`);
  console.log(`   Erros: ${unusedVarsErrors.length}`);

  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let modified = false;

    // Processar cada erro (do fim para o início para não afetar números de linha)
    const sortedErrors = unusedVarsErrors.sort((a, b) => b.line - a.line);

    for (const error of sortedErrors) {
      const lineIndex = error.line - 1;
      let line = lines[lineIndex];

      // Extrair nome da variável da mensagem
      const match = error.message.match(/'([^']+)'/);
      if (!match) continue;

      const varName = match[1];
      if (varName.startsWith('_')) continue; // Já prefixada

      // Tipo 1: Import não utilizado
      if (line.trim().startsWith('import')) {
        // Import nomeado { ... }
        if (line.includes('{') && line.includes('}')) {
          const importMatch = line.match(/\{([^}]+)\}/);
          if (importMatch) {
            const imports = importMatch[1].split(',').map(i => i.trim());
            const filteredImports = imports.filter(imp => {
              const importName = imp.split(' as ')[0].trim();
              return importName !== varName;
            });

            if (filteredImports.length === 0) {
              lines[lineIndex] = ''; // Remove linha
              modified = true;
              totalFixed++;
              console.log(`     ✓ Removido import: ${varName}`);
            } else if (filteredImports.length < imports.length) {
              lines[lineIndex] = line.replace(importMatch[1], filteredImports.join(', '));
              modified = true;
              totalFixed++;
              console.log(`     ✓ Removido de imports: ${varName}`);
            }
          }
        }
        // Import default
        else {
          const defaultMatch = line.match(/import\s+(\w+)\s+from/);
          if (defaultMatch && defaultMatch[1] === varName) {
            lines[lineIndex] = '';
            modified = true;
            totalFixed++;
            console.log(`     ✓ Removido import default: ${varName}`);
          }
        }
      }

      // Tipo 2: Variável/const/let - prefixar com _
      else {
        const patterns = [
          new RegExp(`\\bconst\\s+${varName}\\b`),
          new RegExp(`\\blet\\s+${varName}\\b`),
          new RegExp(`([({,]\\s*)${varName}(\\s*[,})])`), // Desestruturação
          new RegExp(`(=>\\s*\\(\\s*[^)]*?)\\b${varName}\\b`), // Arrow function param
          new RegExp(`(function\\s*\\([^)]*?)\\b${varName}\\b`), // Function param
          new RegExp(`(\\.catch\\s*\\(\\s*)${varName}\\b`), // Catch param
          new RegExp(`(\\.then\\s*\\([^)]*?)\\b${varName}\\b`), // Then param
        ];

        for (const pattern of patterns) {
          if (pattern.test(line)) {
            // Estratégia de substituição segura
            const newLine = line.replace(
              new RegExp(`(\\b)${varName}(\\b)`, 'g'),
              `$1_${varName}$2`
            );

            if (newLine !== line) {
              lines[lineIndex] = newLine;
              modified = true;
              totalFixed++;
              console.log(`     ✓ Prefixado: ${varName}`);
              break;
            }
          }
        }
      }
    }

    if (modified) {
      // Limpar múltiplas linhas vazias
      let cleaned = lines.join('\n');
      cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

      fs.writeFileSync(filePath, cleaned, 'utf-8');
      filesProcessed++;
      console.log(`   ✅ Salvo`);
    }

  } catch (error) {
    console.error(`   ❌ Erro: ${error.message}`);
  }
}

console.log(`\n✨ Processo concluído!`);
console.log(`📁 Arquivos processados: ${filesProcessed}`);
console.log(`🔧 Erros corrigidos: ${totalFixed}`);
console.log(`\n🧪 Execute 'npm run lint | tail -5' para verificar`);
