#!/bin/bash

# Script para copiar assets de animação do protótipo para o projeto

PROTOTYPE_DIR="/mnt/overpower/apps/dev/agl/crowbar/crowbar-mobile/ai-docs/planning/prototype"
ASSETS_DIR="/mnt/overpower/apps/dev/agl/crowbar/crowbar-mobile/src/assets/animations"

echo "📦 Copiando assets de animação do protótipo..."

# Criar estrutura de diretórios
mkdir -p "$ASSETS_DIR/emojis/beijo"
mkdir -p "$ASSETS_DIR/emojis/bravo"
mkdir -p "$ASSETS_DIR/emojis/cool"
mkdir -p "$ASSETS_DIR/emojis/lingua"
mkdir -p "$ASSETS_DIR/emojis/saida"
mkdir -p "$ASSETS_DIR/fire/explosion"
mkdir -p "$ASSETS_DIR/fire/product"
mkdir -p "$ASSETS_DIR/fire/smoke"
mkdir -p "$ASSETS_DIR/fire/burst"
mkdir -p "$ASSETS_DIR/ice/blizzard"
mkdir -p "$ASSETS_DIR/ice/bottom"
mkdir -p "$ASSETS_DIR/ice/footer"
mkdir -p "$ASSETS_DIR/ice/top"
mkdir -p "$ASSETS_DIR/meteor/asteroid"
mkdir -p "$ASSETS_DIR/meteor/product"
mkdir -p "$ASSETS_DIR/meteor/exit"

# Copiar emojis
echo "😘 Copiando emoji beijo..."
cp "$PROTOTYPE_DIR/BEIJO/"*.png "$ASSETS_DIR/emojis/beijo/" 2>/dev/null || true

echo "😠 Copiando emoji bravo..."
cp "$PROTOTYPE_DIR/BRAVO/"*.png "$ASSETS_DIR/emojis/bravo/" 2>/dev/null || true

echo "😎 Copiando emoji cool..."
cp "$PROTOTYPE_DIR/COOL/"*.png "$ASSETS_DIR/emojis/cool/" 2>/dev/null || true

echo "😛 Copiando emoji língua..."
cp "$PROTOTYPE_DIR/LINGUA/"*.png "$ASSETS_DIR/emojis/lingua/" 2>/dev/null || true

echo "🎉 Copiando emoji saída..."
cp "$PROTOTYPE_DIR/SAIDA EMOJIS/"*.png "$ASSETS_DIR/emojis/saida/" 2>/dev/null || true

# Copiar tema fogo
echo "🔥 Copiando tema fogo..."
cp "$PROTOTYPE_DIR/FOGO/EXPLOSAO_FOGO/"*.png "$ASSETS_DIR/fire/explosion/" 2>/dev/null || true
cp "$PROTOTYPE_DIR/FOGO/FOGO_PRODUTO/"*.png "$ASSETS_DIR/fire/product/" 2>/dev/null || true
cp "$PROTOTYPE_DIR/FOGO/FUMAÇA_FOGO/"*.png "$ASSETS_DIR/fire/smoke/" 2>/dev/null || true
cp "$PROTOTYPE_DIR/FOGO/RAJADA_FOGO/"*.png "$ASSETS_DIR/fire/burst/" 2>/dev/null || true

# Copiar tema gelo
echo "❄️ Copiando tema gelo..."
cp "$PROTOTYPE_DIR/GELO/GELO_NEVASCA/"*.png "$ASSETS_DIR/ice/blizzard/" 2>/dev/null || true
cp "$PROTOTYPE_DIR/GELO/GELO_BAIXO/"*.png "$ASSETS_DIR/ice/bottom/" 2>/dev/null || true
cp "$PROTOTYPE_DIR/GELO/GELO_FOOTER/"*.png "$ASSETS_DIR/ice/footer/" 2>/dev/null || true
cp "$PROTOTYPE_DIR/GELO/GELO_TOPO/"*.png "$ASSETS_DIR/ice/top/" 2>/dev/null || true

# Copiar tema meteoro
echo "☄️ Copiando tema meteoro..."
cp "$PROTOTYPE_DIR/METEORO/asteroid/"*.png "$ASSETS_DIR/meteor/asteroid/" 2>/dev/null || true
cp "$PROTOTYPE_DIR/METEORO/explosao_produto/"*.png "$ASSETS_DIR/meteor/product/" 2>/dev/null || true
cp "$PROTOTYPE_DIR/METEORO/explosao_saida/"*.png "$ASSETS_DIR/meteor/exit/" 2>/dev/null || true

# Contar arquivos copiados
TOTAL_FILES=$(find "$ASSETS_DIR" -name "*.png" | wc -l)

echo ""
echo "✅ Cópia concluída!"
echo "📊 Total de arquivos copiados: $TOTAL_FILES"
echo ""
echo "📁 Estrutura criada em: $ASSETS_DIR"
echo ""
echo "Diretórios criados:"
find "$ASSETS_DIR" -type d -print | sort