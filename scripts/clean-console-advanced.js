#!/usr/bin/env node

/**
 * Advanced script to handle console statements in production
 */

const fs = require('fs');
const _path = require('path');
const glob = require('glob');

// Files where we should completely remove console
const REMOVE_CONSOLE_FILES = [
  'src/components/**/*.{ts,tsx}',
  'src/screens/**/*.{ts,tsx}',
  'src/hooks/**/*.{ts,tsx}',
  'src/navigation/**/*.{ts,tsx}',
  'src/store/**/*.{ts,tsx}',
];

// Files where we should comment out console instead of removing
const COMMENT_CONSOLE_FILES = [
  'src/services/**/*.{ts,tsx}',
  'src/utils/**/*.{ts,tsx}',
];

// Files to skip entirely
const SKIP_FILES = [
  '**/loggerService.ts',
  '**/monitoringService.ts',
  '**/__tests__/**',
  '**/*.test.*',
  '**/*.spec.*',
];

function shouldSkipFile(filePath) {
  for (const pattern of SKIP_FILES) {
    if (filePath.includes(pattern.replace('**/', '').replace('/**', ''))) {
      return true;
    }
  }
  return false;
}

function commentOutConsole(content) {
  let modified = content;
  let count = 0;
  
  // Match console statements including multiline
  const patterns = [
    // Simple console.* statements
    /^(\s*)console\.(log|warn|error|info|debug|trace)\(/gm,
    // Console in .catch or inline
    /\.catch\s*\(\s*console\.(log|warn|error|info|debug|trace)\s*\)/g,
  ];
  
  // Comment out simple console statements
  modified = modified.replace(patterns[0], (match, indent) => {
    count++;
    return `${indent}// console.${match.split('.')[1]}`;
  });
  
  // Replace .catch(console.error) with proper error handling
  modified = modified.replace(patterns[1], (_match) => {
    count++;
    return '.catch((error) => { /* TODO: Handle error properly */ })';
  });
  
  return { modified, count };
}

function removeConsoleStatements(content) {
  let modified = content;
  let count = 0;
  
  // Remove standalone console statements
  const standalonePattern = /^\s*console\.(log|warn|error|info|debug|trace|assert|group|groupEnd|time|timeEnd|table|dir|dirxml|count|profile|profileEnd)\s*\([^)]*\);\s*$/gm;
  
  const matches = content.match(standalonePattern);
  if (matches) {
    count = matches.length;
  }
  
  modified = modified.replace(standalonePattern, '');
  
  // Clean up empty lines
  modified = modified.replace(/^\s*\n\s*\n/gm, '\n');
  
  return { modified, count };
}

function processFiles() {
  let totalFiles = 0;
  let totalRemoved = 0;
  let totalCommented = 0;
  
  console.log('🧹 Cleaning console statements from production code...\n');
  
  // Process files where we remove console
  console.log('📝 Removing console statements...');
  for (const pattern of REMOVE_CONSOLE_FILES) {
    const files = glob.sync(pattern, { nodir: true });
    
    for (const file of files) {
      if (shouldSkipFile(file)) continue;
      
      const content = fs.readFileSync(file, 'utf8');
      const { modified, count } = removeConsoleStatements(content);
      
      if (count > 0) {
        fs.writeFileSync(file, modified);
        console.log(`  ✅ ${file}: Removed ${count} statement(s)`);
        totalFiles++;
        totalRemoved += count;
      }
    }
  }
  
  // Process files where we comment console
  console.log('\n💬 Commenting console statements in services...');
  for (const pattern of COMMENT_CONSOLE_FILES) {
    const files = glob.sync(pattern, { nodir: true });
    
    for (const file of files) {
      if (shouldSkipFile(file)) continue;
      
      const content = fs.readFileSync(file, 'utf8');
      const { modified, count } = commentOutConsole(content);
      
      if (count > 0) {
        fs.writeFileSync(file, modified);
        console.log(`  ✅ ${file}: Commented ${count} statement(s)`);
        totalFiles++;
        totalCommented += count;
      }
    }
  }
  
  console.log(`\n🎉 Done!`);
  console.log(`   📊 Modified ${totalFiles} files`);
  console.log(`   🗑️  Removed ${totalRemoved} console statements`);
  console.log(`   💬 Commented ${totalCommented} console statements`);
}

// Run the script
try {
  processFiles();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}