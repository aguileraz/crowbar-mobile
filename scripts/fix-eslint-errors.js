#!/usr/bin/env node

const { execSync } = require('child_process');
const _fs = require('fs');
const _path = require('path');

console.log('🔧 Starting ESLint auto-fix process...\n');

// Run ESLint auto-fix
console.log('Running ESLint auto-fix...');
try {
  execSync('npm run lint -- --fix', { stdio: 'inherit' });
  console.log('✅ ESLint auto-fix completed\n');
} catch (e) {
  console.log('⚠️  ESLint auto-fix completed with some remaining issues\n');
}

// Get remaining errors
console.log('Analyzing remaining errors...');
const eslintOutput = execSync('npm run lint -- --format json || true', { 
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024 // 10MB buffer
});

let results;
try {
  results = JSON.parse(eslintOutput);
} catch (e) {
  console.error('Failed to parse ESLint output');
  process.exit(1);
}

// Count errors by type
const errorStats = {
  totalErrors: 0,
  totalWarnings: 0,
  errorTypes: {},
  warningTypes: {},
  fileCount: 0
};

results.forEach(file => {
  if (file.errorCount > 0 || file.warningCount > 0) {
    errorStats.fileCount++;
    errorStats.totalErrors += file.errorCount;
    errorStats.totalWarnings += file.warningCount;
    
    file.messages.forEach(message => {
      const type = message.severity === 2 ? 'errorTypes' : 'warningTypes';
      errorStats[type][message.ruleId] = (errorStats[type][message.ruleId] || 0) + 1;
    });
  }
});

// Display results
console.log('\n📊 ESLint Analysis Results:');
console.log('─'.repeat(50));
console.log(`Files with issues: ${errorStats.fileCount}`);
console.log(`Total errors: ${errorStats.totalErrors}`);
console.log(`Total warnings: ${errorStats.totalWarnings}`);

if (errorStats.totalErrors > 0) {
  console.log('\n❌ Top errors that need manual fixing:');
  Object.entries(errorStats.errorTypes)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([rule, count]) => {
      console.log(`  ${rule}: ${count}`);
    });
}

if (errorStats.totalWarnings > 0) {
  console.log('\n⚠️  Top warnings:');
  Object.entries(errorStats.warningTypes)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([rule, count]) => {
      console.log(`  ${rule}: ${count}`);
    });
}

// Provide next steps
console.log('\n📋 Next steps:');
if (errorStats.totalErrors > 0) {
  console.log('1. Fix remaining errors manually');
  console.log('2. Focus on the most common error types first');
  console.log('3. Run "npm run lint" to verify fixes');
} else if (errorStats.totalWarnings > 0) {
  console.log('1. All errors fixed! 🎉');
  console.log('2. Consider fixing warnings for better code quality');
  console.log('3. Update ESLint rules if some warnings are not relevant');
} else {
  console.log('✅ All ESLint issues resolved! 🎉');
}

process.exit(errorStats.totalErrors > 0 ? 1 : 0);