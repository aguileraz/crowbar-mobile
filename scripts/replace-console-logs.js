#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
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

function getImportStatement(filePath) {
  const ext = path.extname(filePath);
  const isTypeScript = ext === '.ts' || ext === '.tsx';
  const relativePath = path.relative(path.dirname(filePath), 'src/services/loggerService').replace(/\\/g, '/');
  
  // Ajustar caminho relativo
  let importPath = relativePath;
  if (!importPath.startsWith('.')) {
    importPath = './' + importPath;
  }
  
  return `import logger from '${importPath}'${isTypeScript ? '' : '.ts'};\n`;
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
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
      const importStatement = getImportStatement(filePath);
      
      if (importMatch) {
        // Adicionar após os outros imports
        const lastImportIndex = importMatch.index + importMatch[0].length;
        content = content.slice(0, lastImportIndex) + importStatement + content.slice(lastImportIndex);
      } else {
        // Adicionar no início do arquivo
        content = importStatement + '\n' + content;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      return true;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
  return false;
}

// Encontrar todos os arquivos
const files = glob.sync('src/**/*.{js,jsx,ts,tsx}', {
  ignore: ignorePatterns,
  cwd: process.cwd(),
});

console.log(`🔍 Found ${files.length} files to process\n`);

let processedCount = 0;
let modifiedCount = 0;

files.forEach(file => {
  processedCount++;
  if (processFile(file)) {
    modifiedCount++;
    console.log(`✅ Modified: ${file}`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`Files processed: ${processedCount}`);
console.log(`Files modified: ${modifiedCount}`);
console.log(`\n✨ Console statements replacement completed!`);

// Verificar se ainda restam console statements
console.log('\n🔍 Checking for remaining console statements...');
const { execSync } = require('child_process');
try {
  const remaining = execSync('npm run lint 2>&1 | grep "console" | wc -l', { encoding: 'utf8' }).trim();
  console.log(`Remaining console warnings: ${remaining}`);
} catch (error) {
  // Ignore errors from lint command
}