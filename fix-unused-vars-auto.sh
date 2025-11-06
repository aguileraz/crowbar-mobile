#!/bin/bash

# Script para prefixar variáveis não utilizadas com _
# Baseado nos erros do ESLint

echo "🔍 Corrigindo variáveis não utilizadas automaticamente..."
echo

# Arquivos principais (não incluir testes por enquanto)
FILES=$(find src -name "*.ts" -o -name "*.tsx" | grep -v "test\|__tests__\|\.test\." | head -20)

for file in $FILES; do
  echo "📝 Processando: $file"

  # Pegar erros de variáveis não utilizadas para este arquivo
  ERRORS=$(npx eslint "$file" 2>&1 | grep "@typescript-eslint/no-unused-vars" | grep "error")

  if [ -z "$ERRORS" ]; then
    echo "   ✅ Sem erros"
    continue
  fi

  # Contar quantos erros
  ERROR_COUNT=$(echo "$ERRORS" | wc -l)
  echo "   🔧 Encontrados $ERROR_COUNT erros"

  # Extrair nomes de variáveis e prefixar com _
  while IFS= read -r line; do
    # Extrair nome da variável do erro
    VAR_NAME=$(echo "$line" | sed -n "s/.*'\([^']*\)' is.*/\1/p")

    if [ ! -z "$VAR_NAME" ] && [ "$VAR_NAME" != "_" ]; then
      # Substituir declaração da variável
      # Padrões: const varName, let varName, function(varName), {varName} =
      sed -i "s/\bconst ${VAR_NAME}\b/const _${VAR_NAME}/g" "$file"
      sed -i "s/\blet ${VAR_NAME}\b/let _${VAR_NAME}/g" "$file"
      sed -i "s/([^)]*\b${VAR_NAME}\b/\0/g; s/\b${VAR_NAME}\b/_${VAR_NAME}/" "$file"
    fi
  done <<< "$ERRORS"

  echo "   ✅ Corrigido"
done

echo
echo "✨ Processo concluído!"
echo "🧪 Execute 'npm run lint' para verificar"
