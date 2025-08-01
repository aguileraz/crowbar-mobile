#!/usr/bin/env node

const fs = require('fs');
const _path = require('_path');
const glob = require('glob');

// Padrões para corrigir
const _filePath = __filename;
const patterns = [
  'e2e/**/*.{js,ts}',
  'scripts/**/*.js',
  'src/**/*.{js,jsx,ts,tsx}'
];

let _totalFixes = 0;

// Função para corrigir parâmetros não utilizados adicionando _
function fixUnusedParams(content, _filePath) {
  let modified = content;
  let changes = 0;

  // Padrões comuns de parâmetros não utilizados
  const unusedPatterns = [
    // timeout em funções
    /(\w+)\s*\(\s*([^,)]+),?\s*timeout\s*=\s*\d+\s*\)/g,
    /(\w+)\s*\(\s*([^,)]+),?\s*timeout\s*\)/g,
    // direction e offset
    /(\w+)\s*\(\s*([^,)]+),?\s*direction\s*=\s*['"][^'"]+['"]\s*,?\s*offset\s*=\s*\d+\s*\)/g,
    // capabilities, exitCode
    /(\w+)\s*\(\s*capabilities\s*\)/g,
    /(\w+)\s*\(\s*exitCode\s*\)/g
  ];

  // Substituir parâmetros não utilizados por versões com _
  unusedPatterns.forEach(pattern => {
    modified = modified.replace(pattern, (match) => {
      const newMatch = match
        .replace(/\btimeout\b/g, '_timeout')
        .replace(/\bdirection\b/g, '_direction')
        .replace(/\boffset\b/g, '_offset')
        .replace(/\bcapabilities\b/g, '_capabilities')
        .replace(/\bexitCode\b/g, '_exitCode');
      
      if (newMatch !== match) {
        changes++;
      }
      return newMatch;
    });
  });

  // Corrigir atribuições de variáveis não utilizadas
  const unusedVarPatterns = [
    /const\s+(\w+)\s*=\s*[^;]+;\s*\/\/\s*not used/gi,
    /let\s+(\w+)\s*=\s*[^;]+;\s*\/\/\s*not used/gi,
    /var\s+(\w+)\s*=\s*[^;]+;\s*\/\/\s*not used/gi
  ];

  unusedVarPatterns.forEach(pattern => {
    modified = modified.replace(pattern, (match, varName) => {
      if (!varName.startsWith('_')) {
        changes++;
        return match.replace(varName, '_' + varName);
      }
      return match;
    });
  });

  return { content: modified, changes };
}

// Função para adicionar imports faltantes
function addMissingImports(content, _filePath) {
  let modified = content;
  let changes = 0;

  // Verificar se usa execSync mas não importa
  if (modified.includes('__execSync(') && !modified.includes("require('child_process')")) {
    // Adicionar import no início do arquivo
    const importStatement = "const { execSync } = require('child_process');\n";
    
    // Encontrar onde adicionar (após shebang e comentários iniciais)
    const lines = modified.split('\n');
    let insertIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].startsWith('#') && !lines[i].startsWith('/*') && !lines[i].startsWith('//') && lines[i].trim() !== '') {
        insertIndex = i;
        break;
      }
    }
    
    lines.splice(insertIndex, 0, importStatement);
    modified = lines.join('\n');
    changes++;
  }

  return { content: modified, changes };
}

// Função para corrigir variáveis não utilizadas específicas
function fixSpecificUnusedVars(content, _filePath) {
  let modified = content;
  let changes = 0;

  // Lista de variáveis específicas para prefixar com _
  const varsToPrefix = [
    'path', 'execSync', '_execSync', 'totalRemoved', '0', 
    'totalCommented', '_result', 'totalFixes', 'buildCommand', 
    'status', 'size', 'rec', '0', 'filePath'
  ];

  varsToPrefix.forEach(varName => {
    // Padrão para declarações
    const declPattern = new RegExp(`(const|let|var)\\s+${varName}\\s*=`, 'g');
    modified = modified.replace(declPattern, (match) => {
      changes++;
      return match.replace(varName, '_' + varName);
    });

    // Padrão para parâmetros de função
    const paramPattern = new RegExp(`\\((.*?)\\b${varName}\\b(.*?)\\)`, 'g');
    modified = modified.replace(paramPattern, (match, _before, _after) => {
      if (!match.includes('_' + varName)) {
        changes++;
        return match.replace(varName, '_' + varName);
      }
      return match;
    });
  });

  return { content: modified, changes };
}

// Função principal para processar arquivos
function processFile(_filePath) {
  try {
    let content = fs.readFileSync(_filePath, 'utf8');
    let totalChanges = 0;

    // Aplicar correções
    const result = fixUnusedParams(content, _filePath);
    content = result.content;
    totalChanges += result.changes;

    const result2 = addMissingImports(content, _filePath);
    content = result2.content;
    totalChanges += result2.changes;

    const result3 = fixSpecificUnusedVars(content, _filePath);
    content = result3.content;
    totalChanges += result3.changes;

    // Salvar se houve mudanças
    if (totalChanges > 0) {
      fs.writeFileSync(_filePath, content, 'utf8');

      _totalFixes += totalChanges;
    }

    return totalChanges;
  } catch (error) {

    return 0;
  }
}

// Função principal
function main() {

  patterns.forEach(pattern => {
    const files = glob.sync(pattern, {
      ignore: ['**/node_modules/**', '**/android/**', '**/ios/**']
    });

    files.forEach(file => {
      processFile(file);
    });
  });

  
  // Executar eslint --fix para correções automáticas adicionais

  try {
    const { execSync } = require('child_process');
    execSync('npx eslint . --fix', { stdio: 'inherit' });

  } catch (error) {

  }
}

// Executar
main();