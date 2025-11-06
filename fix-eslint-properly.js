#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 Starting focused ESLint fix...');

// Get files with the most problematic unused variable errors
let lintOutput;
try {
  lintOutput = execSync('npm run lint 2>&1', { encoding: 'utf8' });
} catch (error) {
  lintOutput = error.output[1]; // stdout from failed command
}
const lines = lintOutput.split('\n');

// Extract file paths and error types
const fileErrors = new Map();

lines.forEach(line => {
  if (line.includes('error') && line.includes('@typescript-eslint/no-unused-vars')) {
    const match = line.match(/^([^:]+):(\d+):(\d+)\s+error\s+(.+?)\s+@typescript-eslint\/no-unused-vars/);
    if (match) {
      const [, filePath, lineNum, , errorMsg] = match;
      if (!fileErrors.has(filePath)) {
        fileErrors.set(filePath, []);
      }
      fileErrors.get(filePath).push({
        line: parseInt(lineNum),
        error: errorMsg
      });
    }
  }
});

console.log(`Found unused variable errors in ${fileErrors.size} files`);

// Fix files one by one
let fixedFiles = 0;
let totalFixes = 0;

for (const [filePath, errors] of fileErrors) {
  if (!fs.existsSync(filePath)) continue;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Sort errors by line number descending to avoid line number shifts
    errors.sort((a, b) => b.line - a.line);
    
    for (const error of errors) {
      const lines = content.split('\n');
      if (error.line > lines.length) continue;
      
      const line = lines[error.line - 1];
      
      // Fix common patterns
      if (error.error.includes("'") && error.error.includes("is defined but never used")) {
        const varMatch = error.error.match(/'([^']+)' is defined but never used/);
        if (varMatch) {
          const varName = varMatch[1];
          
          // Don't fix certain patterns
          if (varName.startsWith('_') || 
              ['React', 'Component', 'StyleSheet', 'View', 'Text'].includes(varName)) {
            continue;
          }
          
          // Fix by prefixing with underscore
          const newLine = line.replace(new RegExp(`\\b${varName}\\b(?=\\s*[=:,)])`), `_${varName}`);
          if (newLine !== line) {
            lines[error.line - 1] = newLine;
            content = lines.join('\n');
            modified = true;
            totalFixes++;
          }
        }
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      fixedFiles++;
      console.log(`✓ Fixed ${filePath}`);
    }
    
  } catch (err) {
    console.error(`✗ Error fixing ${filePath}:`, err.message);
  }
}

console.log(`\n🎉 Summary:`);
console.log(`  Files processed: ${fileErrors.size}`);
console.log(`  Files modified: ${fixedFiles}`);
console.log(`  Total fixes applied: ${totalFixes}`);

// Run lint again to check progress
console.log('\n🔍 Checking remaining errors...');
try {
  execSync('npm run lint 2>&1 | grep -c "error"', { encoding: 'utf8', stdio: 'inherit' });
} catch (err) {
  console.log('Lint check complete');
}