#!/bin/bash

# Script para criar a estrutura de pastas inicial do projeto React Native.

# Cores para o output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Diretório base
BASE_DIR="src"

# Lista de diretórios a serem criados
DIRECTORIES=(
    "api"
    "assets/images"
    "assets/fonts"
    "components/common"
    "components/ui"
    "config"
    "hooks"
    "navigation"
    "screens/Auth"
    "screens/Main"
    "store/slices"
    "store/thunks"
    "theme"
    "types"
    "utils"
)

echo "🚀 Criando estrutura de pastas em '$BASE_DIR/'..."

# Cria o diretório base se não existir
mkdir -p "$BASE_DIR"

# Itera sobre a lista e cria cada diretório
for dir in "${DIRECTORIES[@]}"; do
    FULL_PATH="$BASE_DIR/$dir"
    if mkdir -p "$FULL_PATH" 2>/dev/null; then
        touch "$FULL_PATH/.gitkeep"
        echo -e "${GREEN}✅ Criado: $FULL_PATH${NC}"
    else
        echo -e "${YELLOW}📁 Já existe: $FULL_PATH${NC}"
    fi
done

echo ""
echo "🎉 Estrutura de pastas criada com sucesso!"