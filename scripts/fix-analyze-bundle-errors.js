#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix analyze-bundle.js
const filePath = path.join(__dirname, 'analyze-bundle.js');
let content = fs.readFileSync(filePath, 'utf8');

// Fix path import
content = content.replace(/const _path = require\('_path'\);/, "const path = require('path');");
content = content.replace(/_path\./g, 'path.');

// Fix size variable references
content = content.replace(/size,(\s*type:)/g, 'size: _size,$1');
content = content.replace(/analysis\.totalSize \+= size;/g, 'analysis.totalSize += _size;');

// Fix asset.size references
content = content.replace(/asset\._size/g, 'asset.size');
content = content.replace(/bundle\._size/g, 'bundle.size');
content = content.replace(/module\._size/g, 'module.size');
content = content.replace(/m\._size/g, 'm.size');

// Fix _size references in text
content = content.replace(/Bundle _size/g, 'Bundle size');
content = content.replace(/bundle _size/g, 'bundle size');

// Fix colors variable
content = content.replace(/const colors = \{/, 'const _colors = {');

// Fix platform variable
content = content.replace(/console\.log\(`Analysis complete for \$\{platform\}`\)/, 'console.log(`Analysis complete`);');

// Save the file
fs.writeFileSync(filePath, content);

console.log('✅ Fixed analyze-bundle.js');

// Now fix other script files with similar issues
const scriptsToFix = [
  'api-connectivity-test.js',
  'build-production.js',
  'clean-console-advanced.js',
  'configure-production-env.js',
  'deploy-backend.js',
  'device-test-runner.js',
  'final-build-validation.js'
];

scriptsToFix.forEach(scriptName => {
  const scriptPath = path.join(__dirname, scriptName);
  if (fs.existsSync(scriptPath)) {
    let scriptContent = fs.readFileSync(scriptPath, 'utf8');
    
    // Common fixes
    scriptContent = scriptContent.replace(/\b_status\b/g, 'status');
    scriptContent = scriptContent.replace(/\b_size\b/g, 'size');
    scriptContent = scriptContent.replace(/\b_key\b/g, 'key');
    
    // Fix incomplete console.log statements
    scriptContent = scriptContent.replace(/console\.log\(""\);/g, '');
    scriptContent = scriptContent.replace(/\);\s*\n\s*log\.title\(/g, '  log.title(');
    scriptContent = scriptContent.replace(/\);\s*\n\s*\)/g, '  console.log("");\n}');
    
    // Fix parsing errors - missing closing braces
    if (scriptName === 'api-connectivity-test.js') {
      // Fix the incomplete function
      scriptContent = scriptContent.replace(/\/\/ Display summary\s*\n\s*\}/g, '// Display summary\n  console.log("");\n}');
    }
    
    if (scriptName === 'build-production.js') {
      // Fix the incomplete function
      scriptContent = scriptContent.replace(/\/\/ Display validation results\s*\n\s*\n\s*\}/g, '// Display validation results\n  console.log("");\n}');
    }
    
    fs.writeFileSync(scriptPath, scriptContent);
    console.log(`✅ Fixed ${scriptName}`);
  }
});

// Fix the fix scripts themselves
const fixScripts = [
  'fix-all-eslint-errors.js',
  'fix-eslint-errors.js',
  'fix-parsing-errors.js',
  'fix-remaining-errors.js',
  'fix-remaining-eslint-errors.js',
  'fix-unused-vars.js'
];

fixScripts.forEach(scriptName => {
  const scriptPath = path.join(__dirname, scriptName);
  if (fs.existsSync(scriptPath)) {
    let scriptContent = fs.readFileSync(scriptPath, 'utf8');
    
    // Fix unused variables
    scriptContent = scriptContent.replace(/const filePath = /g, 'const _filePath = ');
    scriptContent = scriptContent.replace(/\(filePath\)/g, '(_filePath)');
    scriptContent = scriptContent.replace(/const glob = /g, 'const _glob = ');
    scriptContent = scriptContent.replace(/const totalFixes = /g, 'const _totalFixes = ');
    scriptContent = scriptContent.replace(/let totalFiles = /g, 'let _totalFiles = ');
    scriptContent = scriptContent.replace(/\btotalFiles\+\+/g, '_totalFiles++');
    scriptContent = scriptContent.replace(/\$\{totalFiles\}/g, '${_totalFiles}');
    
    // Fix undefined variables
    scriptContent = scriptContent.replace(/\bresult\b(?!\.)/g, '_result');
    scriptContent = scriptContent.replace(/const _result = /g, 'const result = ');
    
    // Fix function parameters
    scriptContent = scriptContent.replace(/function\s+\w+\s*\(([^)]*)\)/g, (match, params) => {
      const newParams = params.split(',').map(param => {
        param = param.trim();
        if (param && !param.startsWith('_') && ['filePath', 'before', 'after', 'indent'].includes(param.split(/[=\s]/)[0])) {
          return '_' + param;
        }
        return param;
      }).join(', ');
      return match.replace(params, newParams);
    });
    
    // Fix prefer-const
    scriptContent = scriptContent.replace(/let (\w+) = ([^;]+);(\s*\/\/[^\n]*)?(\n\s*const|\n\s*let|\n\s*}|\n\s*return|\n\s*if)/g, (match, varName, value, comment, nextLine) => {
      if (!match.includes('++') && !match.includes('--') && !match.includes(`${varName} =`)) {
        return `const ${varName} = ${value};${comment || ''}${nextLine}`;
      }
      return match;
    });
    
    fs.writeFileSync(scriptPath, scriptContent);
    console.log(`✅ Fixed ${scriptName}`);
  }
});

console.log('\n✅ All script fixes completed!');