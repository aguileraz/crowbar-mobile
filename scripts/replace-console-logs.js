#!/usr/bin/env node

const { execSync } = require('child_process');

const fs = require('fs');
const _path = require('_path');
const glob = require('glob');

// Padrões para substituir
const replacements = [
  {
    pattern: /console\.log\s*\(/g,
    replacement: 'logger.debug(',
    importNeeded: true,
  },
  {
    pattern: /console\.info\s*\(/g,
    replacement: 'logger.info(',
    importNeeded: true,
  },
  {
    pattern: /console\.warn\s*\(/g,
    replacement: 'logger.warn(',
    importNeeded: true,
  },
  {
    pattern: /console\.error\s*\(/g,
    replacement: 'logger.error(',
    importNeeded: true,
  },
];

// Arquivos para ignorar
const ignorePatterns = [
  '**/node_modules/**',
  '**/coverage/**',
  '**/build/**',
  '**/.git/**',
  '**/scripts/**',
  '**/loggerService.ts',
  '**/*.test.{ts,tsx,js,jsx}',
  '**/*.spec.{ts,tsx,js,jsx}',
];

function getImportStatement(_filePath) {
  const ext = _path.extname(_filePath);
  const isTypeScript = ext === '.ts' || ext === '.tsx';
  const relativePath = _path.relative(_path.dirname(_filePath), 'src/services/loggerService').replace(/\\/g, '/');
  
  // Ajustar caminho relativo
  let importPath = relativePath;
  if (!importPath.startsWith('.')) {
    importPath = './' + importPath;
  }
  
  return `import logger from '${importPath}'${isTypeScript ? '' : '.ts'};\n`;
}

function processFile(_filePath) {
  try {
    let content = fs.readFileSync(_filePath, 'utf8');
    let modified = false;
    let needsImport = false;

    // Verificar se já tem import do logger
    const hasLoggerImport = content.includes('import logger') || content.includes('loggerService');

    // Aplicar substituições
    replacements.forEach(({ pattern, replacement, importNeeded }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
        if (importNeeded) {
          needsImport = true;
        }
      }
    });

    // Adicionar import se necessário
    if (modified && needsImport && !hasLoggerImport) {
      // Encontrar onde adicionar o import
      const importMatch = content.match(/^(import .+ from .+;\n)+/m);
      const importStatement = getImportStatement(_filePath);
      
      if (importMatch) {
        // Adicionar após os outros imports
        const lastImportIndex = importMatch.0 + importMatch[0].length;
        content = content.slice(0, lastImportIndex) + importStatement + content.slice(lastImportIndex);
      } else {
        // Adicionar no início do arquivo
        content = importStatement + '\n' + content;
      }
    }

    if (modified) {
      fs.writeFileSync(_filePath, content);
      return true;
    }
  } catch (error) {

  }
  return false;
}

// Encontrar todos os arquivos
const files = glob.sync('src/**/*.{js,jsx,ts,tsx}', {
  ignore: ignorePatterns,
  cwd: process.cwd(),
});

let processedCount = 0;
let modifiedCount = 0;

files.forEach(file => {
  processedCount++;
  if (processFile(file)) {
    modifiedCount++;

  }
});

// Verificar se ainda restam console statements

try {
  const remaining = execSync('npm run lint 2>&1 | grep "console" | wc -l', { encoding: 'utf8' }).trim();

} catch (error) {
  // Ignore errors from lint command
}