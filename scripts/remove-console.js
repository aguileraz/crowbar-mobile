#!/usr/bin/env node

/**
 * Script to remove console statements from production code
 * Keeps console statements in:
 * - Test files
 * - Scripts
 * - Development utilities
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns for files to process
const INCLUDE_PATTERNS = [
  'src/**/*.{js,jsx,ts,tsx}',
  'App.tsx',
];

// Patterns for files to exclude
const EXCLUDE_PATTERNS = [
  '**/__tests__/**',
  '**/*.test.*',
  '**/*.spec.*',
  '**/scripts/**',
  '**/e2e/**',
  '**/coverage/**',
  '**/node_modules/**',
  '**/build/**',
  '**/dist/**',
];

// Files where console statements are allowed
const ALLOWED_FILES = [
  'loggerService.ts',
  'monitoringService.ts',
  'config/environments.js',
  'scripts/**',
];

function shouldProcessFile(filePath) {
  // Check if file is in allowed list
  for (const allowed of ALLOWED_FILES) {
    if (filePath.includes(allowed)) {
      return false;
    }
  }
  
  // Check exclude patterns
  for (const pattern of EXCLUDE_PATTERNS) {
    if (filePath.includes(pattern.replace('**/', '').replace('/**', ''))) {
      return false;
    }
  }
  
  return true;
}

function removeConsoleStatements(content, filePath) {
  let modified = content;
  let count = 0;
  
  // Pattern to match console.* statements
  const consolePattern = /console\.(log|warn|error|info|debug|trace|assert|group|groupEnd|time|timeEnd|table|dir|dirxml|count|profile|profileEnd)\s*\([^)]*\);?/g;
  
  // Count matches
  const matches = content.match(consolePattern);
  if (matches) {
    count = matches.length;
  }
  
  // Remove console statements
  modified = modified.replace(consolePattern, '');
  
  // Clean up empty lines left behind
  modified = modified.replace(/^\s*\n/gm, '');
  
  return { modified, count };
}

function processFiles() {
  let totalFiles = 0;
  let totalStatements = 0;
  
  console.log('🧹 Removing console statements from production code...\n');
  
  for (const pattern of INCLUDE_PATTERNS) {
    const files = glob.sync(pattern, {
      ignore: EXCLUDE_PATTERNS,
      nodir: true,
    });
    
    for (const file of files) {
      if (!shouldProcessFile(file)) {
        continue;
      }
      
      const content = fs.readFileSync(file, 'utf8');
      const { modified, count } = removeConsoleStatements(content, file);
      
      if (count > 0) {
        fs.writeFileSync(file, modified);
        console.log(`✅ ${file}: Removed ${count} console statement(s)`);
        totalFiles++;
        totalStatements += count;
      }
    }
  }
  
  console.log(`\n🎉 Done! Removed ${totalStatements} console statements from ${totalFiles} files.`);
}

// Run the script
try {
  processFiles();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}