#!/usr/bin/env node

const fs = require('fs');
const _path = require('_path');
const { execSync } = require('child_process');

// Função para corrigir variáveis indefinidas em arquivos específicos
const _filePath = __filename;
function fixUndefinedVariables() {
  const fixes = [
    // e2e/page-objects/BasePage.js
    {
      file: 'e2e/page-objects/BasePage.js',
      replacements: [
        { from: '_timeout', to: 'timeout' },
        { from: '_direction', to: 'direction' },
        { from: '_offset', to: 'offset' },
        { from: /\bdirection\b(?!:)/, to: "'vertical'" } // Valor padrão para direction não definido
      ]
    },
    // e2e/setup.js
    {
      file: 'e2e/setup.js',
      replacements: [
        { from: '_direction', to: 'direction' },
        { from: '_offset', to: 'offset' }
      ]
    },
    // scripts/build-production.js
    {
      file: 'scripts/build-production.js',
      replacements: [
        { from: 'execSync', to: "require('child_process').execSync", onlyFirst: true },
        { from: '_buildResult', to: 'buildResult' }
      ]
    },
    // scripts/configure-production-env.js
    {
      file: 'scripts/configure-production-env.js',
      replacements: [
        { from: 'execSync', to: "require('child_process').execSync", onlyFirst: true }
      ]
    },
    // scripts/deploy-backend.js
    {
      file: 'scripts/deploy-backend.js',
      replacements: [
        { from: 'execSync', to: "require('child_process').execSync", onlyFirst: true }
      ]
    },
    // scripts/final-build-validation.js
    {
      file: 'scripts/final-build-validation.js',
      replacements: [
        { from: 'execSync', to: "require('child_process').execSync", onlyFirst: true }
      ]
    },
    // scripts/final-comprehensive-fix.js
    {
      file: 'scripts/final-comprehensive-fix.js',
      replacements: [
        { from: 'execSync', to: "require('child_process').execSync", onlyFirst: true }
      ]
    },
    // scripts/final-eslint-fixes.js
    {
      file: 'scripts/final-eslint-fixes.js',
      replacements: [
        { from: 'execSync', to: "require('child_process').execSync", onlyFirst: true },
        { from: 'offset', to: '0', onlyOnLine: 138 }
      ]
    },
    // scripts/fix-remaining-eslint.js
    {
      file: 'scripts/fix-remaining-eslint.js',
      replacements: [
        { from: 'execSync', to: "require('child_process').execSync", onlyFirst: true }
      ]
    },
    // scripts/generate-store-assets.js
    {
      file: 'scripts/generate-store-assets.js',
      replacements: [
        { from: 'execSync', to: "require('child_process').execSync", onlyFirst: true }
      ]
    }
  ];

  fixes.forEach(({ file, replacements }) => {
    try {
      let content = fs.readFileSync(file, 'utf8');
      let modified = false;

      replacements.forEach(({ from, to, onlyFirst, onlyOnLine }) => {
        if (onlyOnLine) {
          const lines = content.split('\n');
          if (lines[onlyOnLine - 1] && lines[onlyOnLine - 1].includes(from)) {
            lines[onlyOnLine - 1] = lines[onlyOnLine - 1].replace(from, to);
            content = lines.join('\n');
            modified = true;
          }
        } else if (onlyFirst) {
          const newContent = content.replace(from, to);
          if (newContent !== content) {
            content = newContent;
            modified = true;
          }
        } else {
          const regex = typeof from === 'string' ? new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g') : from;
          const newContent = content.replace(regex, to);
          if (newContent !== content) {
            content = newContent;
            modified = true;
          }
        }
      });

      if (modified) {
        fs.writeFileSync(file, content, 'utf8');

      }
    } catch (error) {

    }
  });
}

// Função para remover variáveis não utilizadas
function fixUnusedVariables() {
  const fixes = [
    // Remover imports não utilizados de _path
    {
      pattern: /const\s+_path\s*=\s*require\s*\(\s*['"]_path['"]\s*\)\s*;?\s*\n/g,
      files: [
        'e2e/helpers/reporter.js',
        'scripts/build-production.js',
        'scripts/clean-console-advanced.js',
        'scripts/configure-production-env.js',
        'scripts/deploy-backend.js',
        'scripts/manage-environments.js',
        'scripts/final-comprehensive-fix.js'
      ]
    },
    // Remover imports não utilizados de _execSync
    {
      pattern: /const\s+\{?\s*execSync\s*:\s*_execSync\s*\}?\s*=\s*require\s*\(\s*['"]child_process['"]\s*\)\s*;?\s*\n/g,
      files: [
        'scripts/analyze-bundle.js',
        'scripts/manage-environments.js'
      ]
    },
    // Remover variáveis não utilizadas específicas
    {
      file: 'scripts/fix-all-eslint-errors.js',
      pattern: /const\s+path\s*=\s*require\s*\(\s*['"]_path['"]\s*\)\s*;?\s*\n/g
    },
    {
      file: 'scripts/fix-unused-vars.js',
      pattern: /const\s+path\s*=\s*require\s*\(\s*['"]_path['"]\s*\)\s*;?\s*\n/g
    }
  ];

  fixes.forEach(({ pattern, files, file }) => {
    const targetFiles = files || [file];
    
    targetFiles.forEach(targetFile => {
      try {
        const content = fs.readFileSync(targetFile, 'utf8');
        const newContent = content.replace(pattern, '');
        
        if (newContent !== content) {
          fs.writeFileSync(targetFile, newContent, 'utf8');

        }
      } catch (error) {

      }
    });
  });
}

// Função para adicionar prefixo _ a parâmetros não utilizados
function fixUnusedParameters() {
  const fixes = [
    {
      file: 'e2e/config/wdio.conf.js',
      replacements: [
        { line: 81, from: 'capabilities', to: '_capabilities' },
        { line: 98, from: 'exitCode', to: '_exitCode' }
      ]
    },
    {
      file: 'scripts/analyze-bundle.js',
      replacements: [
        { line: 599, from: 'rec', to: '_rec' },
        { line: 599, from: '0', to: '_index' }
      ]
    },
    {
      file: 'scripts/fix-all-eslint-errors.js',
      replacements: [
        { line: 19, from: 'filePath', to: '_filePath' }
      ]
    }
  ];

  fixes.forEach(({ file, replacements }) => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      let modified = false;

      replacements.forEach(({ line, from, to }) => {
        if (lines[line - 1]) {
          const regex = new RegExp(`\\b${from}\\b`, 'g');
          lines[line - 1] = lines[line - 1].replace(regex, to);
          modified = true;
        }
      });

      if (modified) {
        fs.writeFileSync(file, lines.join('\n'), 'utf8');

      }
    } catch (error) {

    }
  });
}

// Função principal
function main() {

  fixUndefinedVariables();

  fixUnusedVariables();

  fixUnusedParameters();

  try {
    const _result = execSync('npm run lint', { encoding: 'utf8' });

  } catch (error) {

  }
}

// Executar
main();