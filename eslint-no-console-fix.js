#!/usr/bin/env node

/**
 * Fix no-console ESLint errors by removing console statements from test files
 * and src files (production code should not have console statements)
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 Starting no-console fix...');

// Get all files with no-console errors
let lintOutput;
try {
  lintOutput = execSync('npm run lint 2>&1', { encoding: 'utf8' });
} catch (error) {
  lintOutput = error.output[1];
}

const lines = lintOutput.split('\n');
const consoleErrors = new Map();

lines.forEach(line => {
  const match = line.match(/^([^:]+):(\d+):(\d+)\s+warning\s+Unexpected console statement\s+no-console/);
  if (match) {
    const [, filePath, lineNum] = match;
    if (!consoleErrors.has(filePath)) {
      consoleErrors.set(filePath, []);
    }
    consoleErrors.get(filePath).push(parseInt(lineNum));
  }
});

console.log(`Found console errors in ${consoleErrors.size} files`);

let fixedFiles = 0;
let totalFixes = 0;

for (const [filePath, errorLines] of consoleErrors) {
  if (!fs.existsSync(filePath)) continue;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let modified = false;
    
    // Sort lines descending to avoid shifting line numbers
    errorLines.sort((a, b) => b - a);
    
    for (const lineNum of errorLines) {
      if (lineNum > lines.length) continue;
      
      const line = lines[lineNum - 1];
      
      // Only remove console statements that are clearly debug/development code
      if (line.trim().match(/^console\.(log|info|warn|error|debug)\(/)) {
        // For test files, comment out rather than remove
        if (filePath.includes('__tests__') || filePath.includes('.test.') || filePath.includes('.spec.')) {
          lines[lineNum - 1] = '    // ' + line.trim() + ' // FIXME: Remove debug console';
        } else {
          // For source files, remove completely if it's a standalone console statement
          const trimmed = line.trim();
          if (trimmed.startsWith('console.') && !line.includes('//')) {
            lines[lineNum - 1] = '    // Console statement removed for production';
          } else {
            lines[lineNum - 1] = '    // ' + line.trim() + ' // FIXME: Remove debug console';
          }
        }
        modified = true;
        totalFixes++;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, lines.join('\n'));
      fixedFiles++;
      console.log(`✓ Fixed console statements in ${filePath.replace(process.cwd(), '.')}`);
    }
    
  } catch (err) {
    console.error(`✗ Error fixing ${filePath}:`, err.message);
  }
}

console.log(`\n🎉 No-Console Fix Summary:`);
console.log(`  Files processed: ${consoleErrors.size}`);
console.log(`  Files modified: ${fixedFiles}`);
console.log(`  Console statements fixed: ${totalFixes}`);

// Check remaining errors
console.log('\n🔍 Checking remaining errors...');
try {
  const newLintOutput = execSync('npm run lint 2>&1 | tail -1', { encoding: 'utf8' });
  console.log(newLintOutput.trim());
} catch (err) {
  console.log('Lint check complete');
}