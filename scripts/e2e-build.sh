#!/bin/bash

# Script de build para testes E2E
# Constrói aplicações de debug para iOS e Android com Detox

set -e

echo "🚀 Iniciando build para testes E2E..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log() {
  echo -e "${GREEN}[E2E BUILD]${NC} $1"
}

error() {
  echo -e "${RED}[ERRO]${NC} $1"
  exit 1
}

warning() {
  echo -e "${YELLOW}[AVISO]${NC} $1"
}

# Verificar parâmetros
PLATFORM=${1:-"both"}
BUILD_TYPE=${2:-"debug"}

log "Plataforma: $PLATFORM"
log "Tipo de build: $BUILD_TYPE"

# Limpar builds anteriores
clean_builds() {
  log "Limpando builds anteriores..."
  
  if [[ "$PLATFORM" == "ios" ]] || [[ "$PLATFORM" == "both" ]]; then
    rm -rf ios/build
    cd ios && xcodebuild clean -quiet && cd ..
  fi
  
  if [[ "$PLATFORM" == "android" ]] || [[ "$PLATFORM" == "both" ]]; then
    cd android && ./gradlew clean && cd ..
  fi
}

# Build iOS
build_ios() {
  log "Construindo app iOS para testes E2E..."
  
  # Verificar se está no macOS
  if [[ "$OSTYPE" != "darwin"* ]]; then
    warning "Build iOS disponível apenas no macOS. Pulando..."
    return
  fi
  
  # Instalar pods se necessário
  cd ios
  if [ ! -d "Pods" ]; then
    log "Instalando CocoaPods..."
    pod install
  fi
  cd ..
  
  # Build com Detox
  log "Executando build iOS..."
  npx detox build --configuration ios.sim.$BUILD_TYPE
  
  if [ $? -eq 0 ]; then
    log "Build iOS concluído com sucesso! ✅"
  else
    error "Falha no build iOS"
  fi
}

# Build Android
build_android() {
  log "Construindo app Android para testes E2E..."
  
  # Verificar ANDROID_HOME
  if [ -z "$ANDROID_HOME" ]; then
    error "ANDROID_HOME não está definido. Configure o Android SDK."
  fi
  
  # Verificar Java
  if ! command -v java &> /dev/null; then
    error "Java não encontrado. Instale o JDK."
  fi
  
  # Build com Detox
  log "Executando build Android..."
  npx detox build --configuration android.emu.$BUILD_TYPE
  
  if [ $? -eq 0 ]; then
    log "Build Android concluído com sucesso! ✅"
  else
    error "Falha no build Android"
  fi
}

# Verificar ambiente
check_environment() {
  log "Verificando ambiente..."
  
  # Node.js
  if ! command -v node &> /dev/null; then
    error "Node.js não encontrado. Instale o Node.js."
  fi
  
  # Detox CLI
  if ! command -v detox &> /dev/null; then
    warning "Detox CLI não encontrado. Instalando..."
    npm install -g detox-cli
  fi
  
  # React Native CLI
  if ! command -v react-native &> /dev/null; then
    warning "React Native CLI não encontrado. Usando npx..."
  fi
}

# Preparar ambiente
prepare_environment() {
  log "Preparando ambiente..."
  
  # Instalar dependências se necessário
  if [ ! -d "node_modules" ]; then
    log "Instalando dependências..."
    npm install
  fi
  
  # Criar pasta de relatórios
  mkdir -p e2e/reports
  mkdir -p e2e/screenshots
  mkdir -p e2e/videos
}

# Executar builds
main() {
  log "🏗️  Iniciando processo de build E2E..."
  
  # Verificações
  check_environment
  prepare_environment
  
  # Limpar se solicitado
  if [[ "${CLEAN:-true}" == "true" ]]; then
    clean_builds
  fi
  
  # Executar builds
  case $PLATFORM in
    ios)
      build_ios
      ;;
    android)
      build_android
      ;;
    both)
      build_ios
      build_android
      ;;
    *)
      error "Plataforma inválida: $PLATFORM. Use 'ios', 'android' ou 'both'."
      ;;
  esac
  
  log "✨ Build E2E concluído!"
  log "Execute 'npm run test:e2e' para rodar os testes"
}

# Executar
main