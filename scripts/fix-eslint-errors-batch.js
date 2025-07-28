#!/usr/bin/env node

const fs = require('fs');
const _path = require('path');
const { execSync } = require('child_process');

// Color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`)
};

// Get initial error count
function getErrorCount() {
  try {
    const output = execSync('npx eslint . --format json', { encoding: 'utf8', stdio: 'pipe' });
    const results = JSON.parse(output);
    let errorCount = 0;
    let warningCount = 0;
    
    results.forEach(file => {
      errorCount += file.errorCount || 0;
      warningCount += file.warningCount || 0;
    });
    
    return { errorCount, warningCount };
  } catch (error) {
    // ESLint exits with non-zero code when there are errors
    if (error.stdout) {
      try {
        const results = JSON.parse(error.stdout);
        let errorCount = 0;
        let warningCount = 0;
        
        results.forEach(file => {
          errorCount += file.errorCount || 0;
          warningCount += file.warningCount || 0;
        });
        
        return { errorCount, warningCount };
      } catch (parseError) {
        log.error('Failed to parse ESLint output');
        return { errorCount: -1, warningCount: -1 };
      }
    }
    return { errorCount: -1, warningCount: -1 };
  }
}

// Fix unused imports in TypeScript/JavaScript files
function fixUnusedImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Get ESLint errors for this file
  try {
    const output = execSync(`npx eslint "${filePath}" --format json`, { encoding: 'utf8', stdio: 'pipe' });
    const results = JSON.parse(output);
    if (results.length === 0 || !results[0].messages) return false;
    
    const errors = results[0].messages.filter(m => 
      m.ruleId === '@typescript-eslint/no-unused-vars' || 
      m.ruleId === 'no-unused-vars'
    );
    
    // Process errors from bottom to top to maintain line numbers
    errors.sort((a, b) => b.line - a.line);
    
    errors.forEach(error => {
      const lines = content.split('\n');
      const lineIndex = error.line - 1;
      const line = lines[lineIndex];
      
      if (line && line.includes('import')) {
        // Check if it's a named import
        const namedImportMatch = line.match(/import\s*{\s*([^}]+)\s*}\s*from/);
        if (namedImportMatch) {
          const imports = namedImportMatch[1].split(',').map(i => i.trim());
          const unusedVar = error.message.match(/'([^']+)'/)?.[1];
          
          if (unusedVar && imports.includes(unusedVar)) {
            const newImports = imports.filter(i => i !== unusedVar);
            if (newImports.length > 0) {
              lines[lineIndex] = line.replace(
                /import\s*{\s*[^}]+\s*}/,
                `import { ${newImports.join(', ')} }`
              );
            } else {
              // Remove entire import line if no imports left
              lines.splice(lineIndex, 1);
            }
            content = lines.join('\n');
            modified = true;
          }
        } else if (line.match(/import\s+\w+\s+from/)) {
          // Default import - remove entire line
          lines.splice(lineIndex, 1);
          content = lines.join('\n');
          modified = true;
        }
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content);
    }
    
    return modified;
  } catch (error) {
    // ESLint exits with non-zero when there are errors
    if (error.stdout) {
      try {
        const results = JSON.parse(error.stdout);
        if (results.length === 0 || !results[0].messages) return false;
        
        const errors = results[0].messages.filter(m => 
          m.ruleId === '@typescript-eslint/no-unused-vars' || 
          m.ruleId === 'no-unused-vars'
        );
        
        // Process errors from bottom to top
        errors.sort((a, b) => b.line - a.line);
        
        errors.forEach(_err => {
          const lines = content.split('\n');
          const lineIndex = _err.line - 1;
          const line = lines[lineIndex];
          
          if (line && line.includes('import')) {
            const namedImportMatch = line.match(/import\s*{\s*([^}]+)\s*}\s*from/);
            if (namedImportMatch) {
              const imports = namedImportMatch[1].split(',').map(i => i.trim());
              const unusedVar = _err.message.match(/'([^']+)'/)?.[1];
              
              if (unusedVar && imports.includes(unusedVar)) {
                const newImports = imports.filter(i => i !== unusedVar);
                if (newImports.length > 0) {
                  lines[lineIndex] = line.replace(
                    /import\s*{\s*[^}]+\s*}/,
                    `import { ${newImports.join(', ')} }`
                  );
                } else {
                  lines.splice(lineIndex, 1);
                }
                content = lines.join('\n');
                modified = true;
              }
            } else if (line.match(/import\s+\w+\s+from/)) {
              lines.splice(lineIndex, 1);
              content = lines.join('\n');
              modified = true;
            }
          }
        });
        
        if (modified) {
          fs.writeFileSync(filePath, content);
        }
        
        return modified;
      } catch (parseError) {
        return false;
      }
    }
    return false;
  }
}

// Fix radix parameter issues
function fixRadixIssues(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix parseInt without radix
  const parseIntRegex = /parseInt\s*\(\s*([^,)]+)\s*\)/g;
  if (parseIntRegex.test(content)) {
    content = content.replace(parseIntRegex, 'parseInt($1, 10)');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
  }
  
  return modified;
}

// Prefix unused variables with underscore
function prefixUnusedVars(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  try {
    const output = execSync(`npx eslint "${filePath}" --format json`, { encoding: 'utf8', stdio: 'pipe' });
    const results = JSON.parse(output);
    if (results.length === 0 || !results[0].messages) return false;
    
    const errors = results[0].messages.filter(m => 
      (m.ruleId === '@typescript-eslint/no-unused-vars' || m.ruleId === 'no-unused-vars') &&
      !m.message.includes('is defined but never used')
    );
    
    // Process from bottom to top
    errors.sort((a, b) => b.line - a.line);
    
    errors.forEach(error => {
      const varName = error.message.match(/'([^']+)'/)?.[1];
      if (varName && !varName.startsWith('_')) {
        const lines = content.split('\n');
        const lineIndex = error.line - 1;
        const line = lines[lineIndex];
        
        if (line) {
          // Handle function parameters
          if (line.includes('(') && line.includes(varName)) {
            lines[lineIndex] = line.replace(
              new RegExp(`\\b${varName}\\b`),
              `_${varName}`
            );
            content = lines.join('\n');
            modified = true;
          }
          // Handle variable declarations
          else if (line.includes('const') || line.includes('let') || line.includes('var')) {
            lines[lineIndex] = line.replace(
              new RegExp(`\\b${varName}\\b`),
              `_${varName}`
            );
            content = lines.join('\n');
            modified = true;
          }
        }
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content);
    }
    
    return modified;
  } catch (error) {
    if (error.stdout) {
      try {
        const results = JSON.parse(error.stdout);
        if (results.length === 0 || !results[0].messages) return false;
        
        const errors = results[0].messages.filter(m => 
          (m.ruleId === '@typescript-eslint/no-unused-vars' || m.ruleId === 'no-unused-vars') &&
          !m.message.includes('is defined but never used')
        );
        
        errors.sort((a, b) => b.line - a.line);
        
        errors.forEach(_err => {
          const varName = _err.message.match(/'([^']+)'/)?.[1];
          if (varName && !varName.startsWith('_')) {
            const lines = content.split('\n');
            const lineIndex = _err.line - 1;
            const line = lines[lineIndex];
            
            if (line) {
              if (line.includes('(') && line.includes(varName)) {
                lines[lineIndex] = line.replace(
                  new RegExp(`\\b${varName}\\b`),
                  `_${varName}`
                );
                content = lines.join('\n');
                modified = true;
              } else if (line.includes('const') || line.includes('let') || line.includes('var')) {
                lines[lineIndex] = line.replace(
                  new RegExp(`\\b${varName}\\b`),
                  `_${varName}`
                );
                content = lines.join('\n');
                modified = true;
              }
            }
          }
        });
        
        if (modified) {
          fs.writeFileSync(filePath, content);
        }
        
        return modified;
      } catch (parseError) {
        return false;
      }
    }
    return false;
  }
}

// Main execution
async function main() {
  log.info('Starting ESLint error batch fix...');
  
  // Get initial counts
  const initialCounts = getErrorCount();
  log.info(`Initial state: ${initialCounts.errorCount} errors, ${initialCounts.warningCount} warnings`);
  
  // Get all TypeScript and JavaScript files
  const files = execSync('find src scripts -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules', { encoding: 'utf8' })
    .split('\n')
    .filter(f => f.trim());
  
  log.info(`Found ${files.length} files to process`);
  
  let filesModified = 0;
  
  // Process each file
  for (const file of files) {
    if (!file) continue;
    
    let fileModified = false;
    
    // Apply fixes
    if (fixUnusedImports(file)) fileModified = true;
    if (fixRadixIssues(file)) fileModified = true;
    if (prefixUnusedVars(file)) fileModified = true;
    
    if (fileModified) {
      filesModified++;
      log.success(`Fixed issues in ${file}`);
    }
  }
  
  log.info(`Modified ${filesModified} files`);
  
  // Run ESLint auto-fix
  log.info('Running ESLint auto-fix...');
  try {
    execSync('npx eslint . --fix', { stdio: 'inherit' });
  } catch (error) {
    // ESLint returns non-zero exit code when there are errors
  }
  
  // Get final counts
  const finalCounts = getErrorCount();
  log.info(`Final state: ${finalCounts.errorCount} errors, ${finalCounts.warningCount} warnings`);
  
  const errorsFixed = initialCounts.errorCount - finalCounts.errorCount;
  const warningsFixed = initialCounts.warningCount - finalCounts.warningCount;
  
  log.success(`Fixed ${errorsFixed} errors and ${warningsFixed} warnings`);
  
  if (finalCounts.errorCount > 0) {
    log.warning(`${finalCounts.errorCount} errors remain. Run 'npm run lint' to see details.`);
  } else {
    log.success('All ESLint errors have been fixed!');
  }
}

main().catch(_error => {
  log.error(`Script failed: ${_error.message}`);
  process.exit(1);
});