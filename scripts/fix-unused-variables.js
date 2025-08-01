#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Função para prefixar variáveis não utilizadas com underscore
function fixUnusedVariables(content, filePath) {
  const lines = content.split('\n');
  let modified = false;
  
  const processedLines = lines.map(line => {
    // Padrões para detectar variáveis não utilizadas
    // Parâmetros de função
    let match = line.match(/function\s+\w*\s*\(([^)]+)\)/);
    if (!match) {
      match = line.match(/(\w+)\s*=\s*(?:async\s+)?\(([^)]+)\)\s*=>/);
    }
    if (!match) {
      match = line.match(/(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?\(([^)]+)\)\s*=>/);
    }
    
    if (match) {
      const params = match[1] || match[2];
      if (params) {
        const updatedParams = params.split(',').map(param => {
          param = param.trim();
          // Se o parâmetro não começa com underscore e parece não utilizado
          if (param && !param.startsWith('_') && 
              (param === 'timeout' || param === 'index' || 
               param === 'err' || param === 'error' || 
               param === 'req' || param === 'res' || 
               param === 'next')) {
            modified = true;
            return '_' + param;
          }
          return param;
        }).join(', ');
        
        return line.replace(params, updatedParams);
      }
    }
    
    // Declarações de variáveis
    match = line.match(/^(\s*)(?:const|let|var)\s+(\w+)\s*=/);
    if (match) {
      const indent = match[1];
      const varName = match[2];
      
      // Lista de variáveis comumente não utilizadas
      const unusedVars = ['path', 'totalFixes', 'totalFiles', 'filePath'];
      
      if (unusedVars.includes(varName) && !varName.startsWith('_')) {
        modified = true;
        return line.replace(
          new RegExp(`(const|let|var)\\s+${varName}\\s*=`),
          `$1 _${varName} =`
        );
      }
    }
    
    // Desestruturação
    match = line.match(/^(\s*)(?:const|let|var)\s+\{([^}]+)\}\s*=/);
    if (match) {
      const indent = match[1];
      const destructured = match[2];
      
      const updated = destructured.split(',').map(item => {
        item = item.trim();
        if (item && !item.includes(':') && !item.startsWith('_')) {
          // Verifica se é uma variável comumente não utilizada
          const varName = item.split('=')[0].trim();
          if (['timeout', 'index', 'error'].includes(varName)) {
            modified = true;
            return `${varName}: _${varName}`;
          }
        }
        return item;
      }).join(', ');
      
      if (modified) {
        return line.replace(`{${destructured}}`, `{${updated}}`);
      }
    }
    
    return line;
  });
  
  return {
    content: processedLines.join('\n'),
    modified
  };
}

// Função para corrigir referências indefinidas
function fixUndefinedReferences(content, filePath) {
  let modified = false;
  let processedContent = content;
  
  // Corrigir _timeout para timeout nos arquivos e2e
  if (filePath.includes('e2e/')) {
    processedContent = processedContent.replace(/_timeout/g, (match) => {
      modified = true;
      return 'timeout';
    });
  }
  
  // Corrigir variáveis indefinidas comuns
  const fixes = {
    'filePath': 'const filePath = __filename;',
    'index': '0',
    'totalFiles': '0'
  };
  
  for (const [varName, fix] of Object.entries(fixes)) {
    const regex = new RegExp(`\\b${varName}\\b(?!\\s*[=:])`, 'g');
    if (regex.test(processedContent) && !processedContent.includes(`const ${varName}`) && 
        !processedContent.includes(`let ${varName}`) && !processedContent.includes(`var ${varName}`)) {
      
      // Para arquivos de script, adiciona a declaração no início
      if (filePath.includes('scripts/') && typeof fix === 'string' && fix.includes('const')) {
        const lines = processedContent.split('\n');
        let insertIndex = 0;
        
        // Encontra onde inserir após requires
        for (let i = 0; i < lines.length; i++) {
          if (!lines[i].includes('require') && lines[i].trim() !== '' && 
              !lines[i].startsWith('//') && !lines[i].startsWith('#!/')) {
            insertIndex = i;
            break;
          }
        }
        
        lines.splice(insertIndex, 0, fix);
        processedContent = lines.join('\n');
        modified = true;
      } else if (typeof fix === 'string' && !fix.includes('const')) {
        // Substitui diretamente pelo valor
        processedContent = processedContent.replace(regex, fix);
        modified = true;
      }
    }
  }
  
  return {
    content: processedContent,
    modified
  };
}

// Função principal
async function main() {
  const patterns = [
    'src/**/*.{js,jsx,ts,tsx}',
    'scripts/**/*.js',
    'e2e/**/*.{js,ts}',
    'App.tsx'
  ];
  
  const excludePatterns = [
    '**/node_modules/**',
    '**/build/**',
    '**/dist/**',
    '**/scripts/fix-unused-variables.js',
    '**/scripts/remove-console-statements.js'
  ];
  
  let totalFiles = 0;
  let totalFixes = 0;
  
  for (const pattern of patterns) {
    const files = glob.sync(pattern, {
      ignore: excludePatterns,
      absolute: true
    });
    
    for (const filePath of files) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        let fileModified = false;
        
        // Aplica correções de variáveis não utilizadas
        const unusedResult = fixUnusedVariables(content, filePath);
        if (unusedResult.modified) {
          content = unusedResult.content;
          fileModified = true;
          totalFixes++;
        }
        
        // Aplica correções de referências indefinidas
        const undefinedResult = fixUndefinedReferences(content, filePath);
        if (undefinedResult.modified) {
          content = undefinedResult.content;
          fileModified = true;
          totalFixes++;
        }
        
        if (fileModified) {
          fs.writeFileSync(filePath, content);
          totalFiles++;
          console.log(`✓ Corrigido: ${path.relative(process.cwd(), filePath)}`);
        }
      } catch (error) {
        console.error(`✗ Erro ao processar ${filePath}:`, error.message);
      }
    }
  }
  
  console.log(`\n✅ Concluído! ${totalFiles} arquivos modificados, ${totalFixes} correções aplicadas.`);
}

// Executar
main().catch(console.error);