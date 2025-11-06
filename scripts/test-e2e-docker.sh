#!/bin/bash
#
# Crowbar Mobile - E2E Tests com Docker Android Emulator
# Versão: 1.0.0
# Data: 2025-11-06
#
# Descrição:
#   Script automatizado para executar testes E2E do Crowbar Mobile
#   usando emulador Android em Docker (budtmo/docker-android)
#
# Uso:
#   ./scripts/test-e2e-docker.sh [opções]
#
# Opções:
#   --skip-build    Pular build do APK (usar APK existente)
#   --keep-running  Manter emulador rodando após testes
#   --debug         Modo debug (verbose logs)
#   --help          Mostrar ajuda
#
# Requisitos:
#   - Docker e Docker Compose instalados
#   - KVM habilitado (/dev/kvm disponível)
#   - ADB instalado
#   - Node.js e npm configurados
#

set -e  # Exit on error

# === CORES PARA OUTPUT ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# === CONFIGURAÇÕES ===
COMPOSE_FILE="docker-compose.android-emulator.yml"
EMULATOR_NAME="crowbar-android-emulator"
ADB_PORT="5555"
NOVNC_PORT="6080"
BOOT_TIMEOUT=300  # 5 minutos
APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"

# === VARIÁVEIS ===
SKIP_BUILD=false
KEEP_RUNNING=false
DEBUG=false

# === FUNÇÕES AUXILIARES ===

print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  ${GREEN}Crowbar Mobile - E2E Tests com Docker Emulator${NC}       ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

check_requirements() {
    print_step "Verificando requisitos..."

    # Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker não encontrado. Por favor, instale Docker primeiro."
        exit 1
    fi
    print_success "Docker: $(docker --version)"

    # Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose não encontrado. Por favor, instale Docker Compose primeiro."
        exit 1
    fi
    print_success "Docker Compose: $(docker-compose --version)"

    # KVM
    if [ ! -e /dev/kvm ]; then
        print_error "/dev/kvm não encontrado. KVM é necessário para aceleração de hardware."
        print_warning "Execute: sudo apt install qemu-kvm && sudo adduser $USER kvm"
        exit 1
    fi
    print_success "KVM disponível"

    # ADB
    if ! command -v adb &> /dev/null; then
        print_error "ADB não encontrado. Por favor, instale Android SDK Platform Tools."
        exit 1
    fi
    print_success "ADB: $(adb --version | head -n1)"

    # Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js não encontrado. Por favor, instale Node.js primeiro."
        exit 1
    fi
    print_success "Node.js: $(node --version)"

    # npm
    if ! command -v npm &> /dev/null; then
        print_error "npm não encontrado. Por favor, instale npm primeiro."
        exit 1
    fi
    print_success "npm: $(npm --version)"

    echo ""
}

start_emulator() {
    print_step "Iniciando Docker Android Emulator..."

    # Verificar se já está rodando
    if docker ps | grep -q $EMULATOR_NAME; then
        print_warning "Emulador já está rodando. Reiniciando..."
        docker-compose -f $COMPOSE_FILE down
    fi

    # Iniciar emulador
    docker-compose -f $COMPOSE_FILE up -d

    print_success "Container iniciado"
    echo ""
}

wait_for_emulator() {
    print_step "Aguardando emulador ficar pronto (timeout: ${BOOT_TIMEOUT}s)..."

    local start_time=$(date +%s)
    local current_time=$start_time
    local elapsed=0

    # Aguardar ADB conectar
    while [ $elapsed -lt $BOOT_TIMEOUT ]; do
        if adb connect localhost:$ADB_PORT &> /dev/null; then
            if adb shell getprop sys.boot_completed 2>/dev/null | grep -q 1; then
                print_success "Emulador pronto! (${elapsed}s)"
                echo ""
                return 0
            fi
        fi

        # Mostrar progresso
        if [ $((elapsed % 10)) -eq 0 ]; then
            echo -ne "${YELLOW}⏳ Aguardando... ${elapsed}s / ${BOOT_TIMEOUT}s\r${NC}"
        fi

        sleep 5
        current_time=$(date +%s)
        elapsed=$((current_time - start_time))
    done

    print_error "Timeout! Emulador não ficou pronto em ${BOOT_TIMEOUT}s"
    print_warning "Verifique logs: docker logs $EMULATOR_NAME"
    print_warning "Ou acesse noVNC: http://localhost:$NOVNC_PORT"
    exit 1
}

check_adb_connection() {
    print_step "Verificando conexão ADB..."

    adb devices -l

    local device_count=$(adb devices | grep -c "localhost:$ADB_PORT.*device$" || true)

    if [ $device_count -eq 0 ]; then
        print_error "Nenhum dispositivo conectado"
        exit 1
    fi

    print_success "ADB conectado: localhost:$ADB_PORT"
    echo ""
}

install_dependencies() {
    print_step "Instalando dependências npm..."

    if [ ! -d "node_modules" ]; then
        npm install
    else
        print_success "node_modules já existe (pulando)"
    fi

    echo ""
}

build_apk() {
    if [ "$SKIP_BUILD" = true ]; then
        print_warning "Pulando build do APK (--skip-build)"
        echo ""
        return 0
    fi

    print_step "Building APK de debug..."

    cd android
    ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug
    cd ..

    if [ ! -f "$APK_PATH" ]; then
        print_error "APK não encontrado: $APK_PATH"
        exit 1
    fi

    local apk_size=$(du -h "$APK_PATH" | cut -f1)
    print_success "APK criado: $APK_PATH ($apk_size)"
    echo ""
}

install_apk() {
    print_step "Instalando APK no emulador..."

    # Desinstalar versão antiga (se existir)
    adb -s localhost:$ADB_PORT uninstall com.crowbar.mobile 2>/dev/null || true

    # Instalar nova versão
    adb -s localhost:$ADB_PORT install -r "$APK_PATH"

    print_success "APK instalado"
    echo ""
}

run_detox_tests() {
    print_step "Executando testes Detox..."
    echo ""

    # Executar testes
    if [ "$DEBUG" = true ]; then
        detox test --configuration android.docker.debug --loglevel trace
    else
        detox test --configuration android.docker.debug
    fi

    echo ""
    print_success "Testes Detox completados!"
    echo ""
}

collect_artifacts() {
    print_step "Coletando artefatos de teste..."

    # Screenshots
    if [ -d "e2e/artifacts" ]; then
        local screenshot_count=$(find e2e/artifacts -name "*.png" | wc -l)
        print_success "Screenshots coletados: $screenshot_count"
    fi

    # Vídeos (se gravados)
    if [ -d "videos" ]; then
        local video_count=$(find videos -name "*.mp4" | wc -l)
        if [ $video_count -gt 0 ]; then
            print_success "Vídeos gravados: $video_count"
        fi
    fi

    echo ""
}

cleanup() {
    if [ "$KEEP_RUNNING" = true ]; then
        print_warning "Mantendo emulador rodando (--keep-running)"
        print_warning "Para parar: docker-compose -f $COMPOSE_FILE down"
        print_warning "noVNC: http://localhost:$NOVNC_PORT"
        print_warning "ADB: adb connect localhost:$ADB_PORT"
    else
        print_step "Parando emulador..."
        docker-compose -f $COMPOSE_FILE down
        print_success "Cleanup completo"
    fi

    echo ""
}

show_help() {
    cat << EOF
Crowbar Mobile - E2E Tests com Docker Android Emulator

Uso:
  ./scripts/test-e2e-docker.sh [opções]

Opções:
  --skip-build     Pular build do APK (usar APK existente)
  --keep-running   Manter emulador rodando após testes
  --debug          Modo debug (logs verbosos)
  --help           Mostrar esta ajuda

Exemplos:
  # Executar testes completos (build + teste)
  ./scripts/test-e2e-docker.sh

  # Executar sem rebuild (mais rápido)
  ./scripts/test-e2e-docker.sh --skip-build

  # Debug com emulador rodando
  ./scripts/test-e2e-docker.sh --debug --keep-running

  # Executar novamente (emulador já rodando)
  ./scripts/test-e2e-docker.sh --skip-build --keep-running

Acesso Manual:
  noVNC: http://localhost:6080
  ADB: adb connect localhost:5555
  Logs: docker logs crowbar-android-emulator

Troubleshooting:
  1. KVM não disponível:
     sudo apt install qemu-kvm
     sudo adduser $USER kvm
     newgrp kvm

  2. ADB não conecta:
     adb kill-server
     adb start-server
     adb connect localhost:5555

  3. Emulador lento:
     Aumentar RAM/CPU em docker-compose.android-emulator.yml

EOF
}

# === PARSE ARGUMENTOS ===
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --keep-running)
            KEEP_RUNNING=true
            shift
            ;;
        --debug)
            DEBUG=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            print_error "Opção desconhecida: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
done

# === MAIN EXECUTION ===

print_header

# Trap para cleanup em caso de erro
trap 'print_error "Script interrompido!"; cleanup; exit 1' INT TERM

check_requirements
start_emulator
wait_for_emulator
check_adb_connection
install_dependencies
build_apk
install_apk
run_detox_tests
collect_artifacts
cleanup

# === SUCCESS ===
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}  ${GREEN}✓ Testes E2E completados com sucesso!${NC}                   ${GREEN}║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

exit 0
