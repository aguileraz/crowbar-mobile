#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Funções de log
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
};

/**
 * Corrige erros comuns de lint automaticamente
 */
function fixCommonLintErrors() {
  log.info('Corrigindo erros comuns de lint...');
  
  try {
    // 1. Corrigir variáveis não usadas adicionando underscore
    log.info('Corrigindo variáveis não usadas...');
    execSync('npx eslint --fix "src/**/*.{ts,tsx}" --rule "@typescript-eslint/no-unused-vars: off"', {
      stdio: 'inherit'
    });
    
    // 2. Corrigir radix em parseInt
    log.info('Corrigindo parseInt sem radix...');
    const files = execSync('find src scripts -name "*.js" -o -name "*.ts" -o -name "*.tsx" 2>/dev/null', {
      encoding: 'utf8'
    }).trim().split('\n');
    
    files.forEach(file => {
      if (!file || !fs.existsSync(file)) return;
      
      try {
        let content = fs.readFileSync(file, 'utf8');
        let modified = false;
        
        // Corrigir parseInt sem radix
        const parseIntRegex = /parseInt\(([^,)]+)\)/g;
        if (parseIntRegex.test(content)) {
          content = content.replace(parseIntRegex, 'parseInt($1, 10)');
          modified = true;
        }
        
        // Corrigir variáveis não usadas em funções (adicionar underscore)
        const unusedParamsRegex = /\(([^)]*)\)\s*=>\s*{/g;
        content = content.replace(unusedParamsRegex, (match, params) => {
          const newParams = params.split(',').map(param => {
            param = param.trim();
            // Se o parâmetro não é usado (simplificação), adicionar underscore
            if (param && !param.startsWith('_') && param !== 'props' && param !== 'state') {
              // Verificar se é realmente não usado (simplificado)
              const paramName = param.split(':')[0].trim();
              const regex = new RegExp(`\\b${paramName}\\b`, 'g');
              const matches = content.match(regex);
              if (matches && matches.length === 1) {
                return '_' + param;
              }
            }
            return param;
          }).join(', ');
          return `(${newParams}) => {`;
        });
        
        if (modified) {
          fs.writeFileSync(file, content);
          log.success(`Corrigido: ${path.basename(file)}`);
        }
      } catch (err) {
        log.warning(`Erro ao processar ${file}: ${err.message}`);
      }
    });
    
    // 3. Remover console.log em produção
    log.info('Removendo console.log...');
    execSync('node scripts/remove-console.js', { stdio: 'inherit' });
    
    // 4. Executar prettier
    log.info('Formatando código com Prettier...');
    execSync('npx prettier --write "src/**/*.{ts,tsx,js,jsx}"', { stdio: 'inherit' });
    
    log.success('Correções aplicadas com sucesso!');
    
    // Verificar quantos erros restam
    const result = execSync('npm run lint 2>&1 | grep -c "error" || true', {
      encoding: 'utf8'
    }).trim();
    
    log.info(`Erros restantes: ${result}`);
    
  } catch (error) {
    log.error(`Erro durante correções: ${error.message}`);
    process.exit(1);
  }
}

// Executar
fixCommonLintErrors();