#!/bin/bash

# Script para executar testes E2E
# Executa testes Detox com diferentes configurações

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
  echo -e "${GREEN}[E2E TEST]${NC} $1"
}

error() {
  echo -e "${RED}[ERRO]${NC} $1"
  exit 1
}

warning() {
  echo -e "${YELLOW}[AVISO]${NC} $1"
}

info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

# Configurações padrão
PLATFORM=${1:-"android"}
TEST_SUITE=${2:-"all"}
HEADLESS=${HEADLESS:-false}
RECORD_VIDEO=${RECORD_VIDEO:-false}
REUSE_DEVICE=${REUSE_DEVICE:-false}
MAX_WORKERS=${MAX_WORKERS:-1}

# Mostrar ajuda
show_help() {
  echo "Uso: ./e2e-run.sh [platform] [suite]"
  echo ""
  echo "Plataformas:"
  echo "  android    - Executar no Android"
  echo "  ios        - Executar no iOS"
  echo ""
  echo "Suites:"
  echo "  all        - Executar todos os testes"
  echo "  auth       - Testes de autenticação"
  echo "  boxes      - Testes de caixas"
  echo "  cart       - Testes de carrinho"
  echo "  favorites  - Testes de favoritos"
  echo "  smoke      - Testes de smoke (rápidos)"
  echo ""
  echo "Variáveis de ambiente:"
  echo "  HEADLESS=true      - Executar sem interface"
  echo "  RECORD_VIDEO=true  - Gravar vídeos dos testes"
  echo "  REUSE_DEVICE=true  - Reutilizar dispositivo"
  echo "  MAX_WORKERS=2      - Número de workers paralelos"
}

# Verificar emulador Android
check_android_emulator() {
  log "Verificando emulador Android..."
  
  if ! command -v adb &> /dev/null; then
    error "ADB não encontrado. Instale o Android SDK."
  fi
  
  # Verificar se há emulador rodando
  if ! adb devices | grep -q "emulator"; then
    warning "Nenhum emulador Android encontrado. Iniciando..."
    start_android_emulator
  else
    log "Emulador Android detectado ✅"
  fi
}

# Iniciar emulador Android
start_android_emulator() {
  log "Iniciando emulador Android..."
  
  # Verificar AVDs disponíveis
  AVDS=$(emulator -list-avds)
  if [ -z "$AVDS" ]; then
    error "Nenhum AVD encontrado. Crie um AVD primeiro."
  fi
  
  # Usar o primeiro AVD ou o especificado
  AVD_NAME=${AVD_NAME:-$(echo "$AVDS" | head -n 1)}
  
  # Iniciar emulador
  if [ "$HEADLESS" = true ]; then
    emulator -avd "$AVD_NAME" -no-window -no-audio &
  else
    emulator -avd "$AVD_NAME" &
  fi
  
  # Aguardar emulador iniciar
  log "Aguardando emulador iniciar..."
  adb wait-for-device
  
  # Aguardar boot completo
  while [ "$(adb shell getprop sys.boot_completed 2>/dev/null)" != "1" ]; do
    sleep 2
  done
  
  log "Emulador iniciado com sucesso ✅"
}

# Verificar simulador iOS
check_ios_simulator() {
  log "Verificando simulador iOS..."
  
  if [[ "$OSTYPE" != "darwin"* ]]; then
    error "Testes iOS disponíveis apenas no macOS"
  fi
  
  # Verificar se simulador está rodando
  if ! xcrun simctl list | grep -q "Booted"; then
    warning "Nenhum simulador iOS encontrado. Iniciando..."
    start_ios_simulator
  else
    log "Simulador iOS detectado ✅"
  fi
}

# Iniciar simulador iOS
start_ios_simulator() {
  log "Iniciando simulador iOS..."
  
  # Usar iPhone 15 por padrão
  SIMULATOR_NAME=${SIMULATOR_NAME:-"iPhone 15"}
  
  # Obter UDID do simulador
  UDID=$(xcrun simctl list devices | grep "$SIMULATOR_NAME" | grep -v "unavailable" | head -n 1 | grep -o "[0-9A-F\-]\{36\}")
  
  if [ -z "$UDID" ]; then
    error "Simulador '$SIMULATOR_NAME' não encontrado"
  fi
  
  # Iniciar simulador
  xcrun simctl boot "$UDID" 2>/dev/null || true
  open -a Simulator
  
  # Aguardar simulador iniciar
  while ! xcrun simctl list | grep "$UDID" | grep -q "Booted"; do
    sleep 2
  done
  
  log "Simulador iniciado com sucesso ✅"
}

# Preparar ambiente de teste
prepare_test_env() {
  log "Preparando ambiente de teste..."
  
  # Criar diretórios necessários
  mkdir -p e2e/reports
  mkdir -p e2e/screenshots
  mkdir -p e2e/videos
  mkdir -p e2e/artifacts
  
  # Limpar relatórios anteriores
  if [ "${CLEAN_REPORTS:-true}" = true ]; then
    rm -rf e2e/reports/*
    rm -rf e2e/screenshots/*
    rm -rf e2e/videos/*
  fi
  
  # Verificar Metro bundler
  if ! curl -s http://localhost:8081/status | grep -q "packager-status:running"; then
    log "Iniciando Metro bundler..."
    npx react-native start --reset-cache > /dev/null 2>&1 &
    sleep 5
  fi
}

# Executar testes
run_tests() {
  local platform=$1
  local suite=$2
  
  log "Executando testes E2E..."
  log "Plataforma: $platform"
  log "Suite: $suite"
  
  # Configurar comando base
  local cmd="npx detox test"
  
  # Adicionar configuração de plataforma
  case $platform in
    android)
      cmd="$cmd --configuration android.emu.debug"
      ;;
    ios)
      cmd="$cmd --configuration ios.sim.debug"
      ;;
  esac
  
  # Adicionar suite específica
  case $suite in
    auth)
      cmd="$cmd e2e/tests/auth"
      ;;
    boxes)
      cmd="$cmd e2e/tests/boxes"
      ;;
    cart)
      cmd="$cmd e2e/tests/cart"
      ;;
    favorites)
      cmd="$cmd e2e/tests/favorites"
      ;;
    smoke)
      cmd="$cmd --grep smoke"
      ;;
    all)
      # Executa todos os testes
      ;;
    *)
      error "Suite inválida: $suite"
      ;;
  esac
  
  # Adicionar opções
  if [ "$REUSE_DEVICE" = true ]; then
    cmd="$cmd --reuse"
  fi
  
  if [ "$RECORD_VIDEO" = true ]; then
    cmd="$cmd --record-videos all --record-logs all"
  fi
  
  if [ "$HEADLESS" = true ]; then
    cmd="$cmd --headless"
  fi
  
  cmd="$cmd --max-workers $MAX_WORKERS"
  
  # Executar testes
  info "Comando: $cmd"
  
  if $cmd; then
    log "✅ Testes concluídos com sucesso!"
    generate_report
  else
    error "❌ Testes falharam"
    generate_report
    exit 1
  fi
}

# Gerar relatório
generate_report() {
  log "Gerando relatório de testes..."
  
  # Copiar artifacts do Detox
  if [ -d ".artifacts" ]; then
    cp -r .artifacts/* e2e/artifacts/ 2>/dev/null || true
  fi
  
  # Gerar relatório HTML
  if [ -f "e2e/reports/test-report.html" ]; then
    info "Relatório HTML gerado: e2e/reports/test-report.html"
    
    # Abrir relatório no navegador (opcional)
    if [ "${OPEN_REPORT:-false}" = true ]; then
      if command -v open &> /dev/null; then
        open e2e/reports/test-report.html
      elif command -v xdg-open &> /dev/null; then
        xdg-open e2e/reports/test-report.html
      fi
    fi
  fi
  
  # Contar resultados
  local total=$(find e2e/reports -name "*.xml" -exec grep -c "testcase" {} \; | awk '{sum += $1} END {print sum}')
  local failed=$(find e2e/reports -name "*.xml" -exec grep -c "failure" {} \; | awk '{sum += $1} END {print sum}')
  local passed=$((total - failed))
  
  echo ""
  echo "📊 Resumo dos Testes:"
  echo "   Total: $total"
  echo "   ✅ Passou: $passed"
  echo "   ❌ Falhou: $failed"
  echo ""
}

# Limpar após testes
cleanup() {
  log "Limpando ambiente..."
  
  # Matar Metro bundler se foi iniciado por este script
  if [ -n "$METRO_PID" ]; then
    kill $METRO_PID 2>/dev/null || true
  fi
  
  # Limpar artifacts temporários
  rm -rf .artifacts 2>/dev/null || true
}

# Trap para limpeza
trap cleanup EXIT

# Main
main() {
  # Verificar ajuda
  if [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
    show_help
    exit 0
  fi
  
  log "🧪 Iniciando testes E2E do Crowbar Mobile"
  
  # Preparar ambiente
  prepare_test_env
  
  # Verificar dispositivo
  case $PLATFORM in
    android)
      check_android_emulator
      ;;
    ios)
      check_ios_simulator
      ;;
    *)
      error "Plataforma inválida: $PLATFORM"
      ;;
  esac
  
  # Executar testes
  run_tests "$PLATFORM" "$TEST_SUITE"
  
  log "✨ Processo de teste concluído!"
}

# Executar
main "$@"