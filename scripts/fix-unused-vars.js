#!/usr/bin/env node

const fs = require('fs');
const _glob = require('glob');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

// Mapeamento de variáveis não utilizadas para remover
const unusedVarsToRemove = {
  '_path': "const _path = require('_path');",
  '_execSync': "const { execSync } = require('child_process');",
  '_crypto': "const crypto = require('crypto');",
  '_detoxConfig': /const\s+_detoxConfig\s*=\s*[^;]+;/,
  '_authFile': /const\s+_authFile\s*=\s*[^;]+;/,
  '_securityResult': /const\s+_securityResult\s*=\s*[^;]+;/,
  '_perfResult': /const\s+_perfResult\s*=\s*[^;]+;/,
  '_buildResult': /const\s+_buildResult\s*=\s*[^;]+;/,
  '_smokeResult': /const\s+_smokeResult\s*=\s*[^;]+;/,
  '_azure': /const\s+_azure\s*=\s*[^;]+;/,
  '_SECURITY_CHECKS': /const\s+_SECURITY_CHECKS\s*=\s*{[^}]+};/s,
};

// Correções específicas para variáveis em parâmetros de função
const parameterFixes = [
  {
    pattern: /\(([^,)]+),\s*timeout\s*\)/g,
    replacement: '($1, _timeout)',
  },
  {
    pattern: /\(([^,)]+),\s*direction\s*,\s*([^,)]+),\s*offset\s*\)/g,
    replacement: '($1, _direction, $2, _offset)',
  },
];

function processFile(_filePath) {
  let content = fs.readFileSync(_filePath, 'utf8');
  let modified = false;
  const changes = [];
  
  // Remove variáveis não utilizadas
  Object.entries(unusedVarsToRemove).forEach(([varName, pattern]) => {
    if (typeof pattern === 'string') {
      if (content.includes(pattern)) {
        content = content.replace(pattern, '');
        modified = true;
        changes.push(`Removed unused ${varName}`);
      }
    } else {
      const match = content.match(pattern);
      if (match) {
        content = content.replace(pattern, '');
        modified = true;
        changes.push(`Removed unused ${varName}`);
      }
    }
  });
  
  // Corrige parâmetros não utilizados em funções
  parameterFixes.forEach(({ pattern, replacement }) => {
    const matches = content.match(pattern);
    if (matches) {
      content = content.replace(pattern, replacement);
      modified = true;
      changes.push('Fixed unused function parameters');
    }
  });
  
  // Remove linhas vazias múltiplas
  if (modified) {
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    fs.writeFileSync(_filePath, content, 'utf8');
  }
  
  return { modified, changes };
}

function main() {
  const patterns = [
    'scripts/*.js',
    'e2e/**/*.js',
    'docker/tests/scripts/*.js',
  ];
  
  const _totalFiles = 0;
  let modifiedFiles = 0;
  let totalChanges = 0;
  
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, { nodir: true });
    
    files.forEach(file => {
      if (file.includes('fix-unused-vars.js')) return; // Pula este script
      
      _totalFiles++;
      const _result = processFile(file);
      
      if (_result.modified) {
        modifiedFiles++;
        totalChanges += _result.changes.length;
      }
    });
  });
  
  process.stdout.write(`\n${colors.bright}${colors.green}✅ Unused Variables Fix Complete!${colors.reset}\n\n`);
  process.stdout.write(`${colors.cyan}📊 Summary:${colors.reset}\n`);
  process.stdout.write(`   Total files scanned: ${_totalFiles}\n`);
  process.stdout.write(`   Files modified: ${modifiedFiles}\n`);
  process.stdout.write(`   Total changes: ${totalChanges}\n\n`);
}

main();