# Docker Android Emulator - Guia de Implementação

**Data**: 2025-11-06 | **Status**: Em Implementação
**Projeto**: Crowbar Mobile - Testes E2E com Emulador Dockerizado

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Comparação de Soluções](#comparação-de-soluções)
3. [Requisitos do Sistema](#requisitos-do-sistema)
4. [Opção 1: budtmo/docker-android (RECOMENDADO)](#opção-1-budtmodockerandroid-recomendado)
5. [Opção 2: Google Android Emulator Container Scripts](#opção-2-google-android-emulator-container-scripts)
6. [Opção 3: Agoda Docker Emulator](#opção-3-agoda-docker-emulator)
7. [Integração com Detox](#integração-com-detox)
8. [Troubleshooting](#troubleshooting)
9. [Referências](#referências)

---

## 🎯 Visão Geral

Este documento fornece um guia completo para implementar um emulador Android em Docker para realizar testes E2E do Crowbar Mobile como se fosse em um dispositivo real.

### Por Que Usar Docker para Emulação Android?

**Vantagens:**
- ✅ **Ambiente Consistente**: Mesmo ambiente em dev, CI/CD e produção
- ✅ **Isolamento**: Múltiplos emuladores sem conflitos
- ✅ **Escalabilidade**: Fácil paralelização de testes
- ✅ **CI/CD Friendly**: Integração perfeita com pipelines
- ✅ **Reprodutibilidade**: Elimina "funciona na minha máquina"
- ✅ **Acesso Remoto**: VNC e web UI para debugging visual

**Desvantagens:**
- ⚠️ **Requer KVM**: Necessário para aceleração de hardware
- ⚠️ **Performance**: Ligeiramente mais lento que emulador nativo
- ⚠️ **Complexidade Inicial**: Setup mais elaborado
- ⚠️ **Recursos**: Consome mais memória e CPU

---

## 📊 Comparação de Soluções

| Solução | Versões Android | noVNC | ADB | Logs Web | Maturidade | Complexidade | Recomendado |
|---------|----------------|-------|-----|----------|------------|--------------|-------------|
| **budtmo/docker-android** | 9.0 - 14.0 | ✅ | ✅ | ✅ | Alta (★★★★★) | Baixa | ✅ **SIM** |
| **Google Scripts** | 28+ (8.0+) | ✅ | ✅ | ✅ | Oficial (★★★★☆) | Média | 🟡 Alternativa |
| **Agoda Emulator** | Customizável | ❌ | ✅ | ❌ | Média (★★★☆☆) | Média | 🟡 Específico |
| **ThedrHax AVD** | x86 headless | ❌ | ✅ | ❌ | Média (★★★☆☆) | Alta | ❌ Avançado |

### Recomendação: budtmo/docker-android

**Por que escolhemos budtmo/docker-android:**
1. ✅ **Mais completo**: noVNC + Web UI + Logs integrados
2. ✅ **Bem documentado**: 2.9k+ stars no GitHub, comunidade ativa
3. ✅ **Suporte amplo**: Android 9 a 14 (API 28-34)
4. ✅ **Fácil setup**: Docker compose pronto
5. ✅ **React Native friendly**: Testado com frameworks mobile
6. ✅ **Atualizado**: Última release v2.1.3 (2024)

---

## 🔧 Requisitos do Sistema

### Hardware Mínimo

```
CPU: 4+ cores (8+ recomendado)
RAM: 8GB (16GB recomendado)
Disco: 20GB+ livres
GPU: Não obrigatória (mas melhora performance)
```

### Software Obrigatório

**1. Docker & Docker Compose**
```bash
# Verificar instalação
docker --version      # Docker version 20.10+
docker-compose --version  # v2.0+

# Instalar no Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose -y
sudo usermod -aG docker $USER
```

**2. KVM (Kernel Virtual Machine)**
```bash
# Verificar suporte a KVM
egrep -c '(vmx|svm)' /proc/cpuinfo
# Se retornar > 0, seu CPU suporta virtualização

# Verificar se KVM está disponível
ls -la /dev/kvm
# Deve existir o device /dev/kvm

# Instalar KVM no Ubuntu/Debian
sudo apt install qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils -y
sudo adduser $USER kvm
```

**3. ADB (Android Debug Bridge)**
```bash
# Instalar Android SDK Platform Tools
sudo apt install android-sdk-platform-tools -y

# Ou via manual download
wget https://dl.google.com/android/repository/platform-tools-latest-linux.zip
unzip platform-tools-latest-linux.zip
export PATH=$PATH:~/platform-tools
```

### Verificação de Pré-requisitos

```bash
# Script de verificação completa
echo "=== Verificação de Pré-requisitos ==="

# Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker instalado: $(docker --version)"
else
    echo "❌ Docker NÃO instalado"
fi

# Docker Compose
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose instalado: $(docker-compose --version)"
else
    echo "❌ Docker Compose NÃO instalado"
fi

# KVM
if [ -e /dev/kvm ]; then
    echo "✅ KVM disponível"
else
    echo "❌ KVM NÃO disponível"
fi

# ADB
if command -v adb &> /dev/null; then
    echo "✅ ADB instalado: $(adb --version)"
else
    echo "❌ ADB NÃO instalado"
fi
```

---

## 🚀 Opção 1: budtmo/docker-android (RECOMENDADO)

### Características

- **Versões Suportadas**: Android 9.0 (API 28) até Android 14.0 (API 34)
- **Acesso Visual**: noVNC (porta 6080) + VNC viewer (porta 5900)
- **Web UI**: Logs e controle via navegador (porta 6080)
- **ADB**: Porta 5555 exposta para conexão externa
- **Gravação de Vídeo**: Suporte a gravação de sessões
- **Device Profiles**: Samsung Galaxy, Nexus, etc.

### Instalação Rápida (Método 1: Docker Run)

```bash
# Criar diretório de trabalho
mkdir -p ~/crowbar-android-emulator
cd ~/crowbar-android-emulator

# Executar emulador Android 13 (API 33 - compatível com Crowbar)
docker run -d \
  --privileged \
  --name android-emulator \
  -e DEVICE="Samsung Galaxy S10" \
  -p 5555:5555 \
  -p 6080:6080 \
  --device /dev/kvm \
  budtmo/docker-android:emulator_13.0

# Aguardar inicialização (2-3 minutos)
docker logs -f android-emulator

# Acessar via navegador
# http://localhost:6080 (noVNC Web UI)

# Conectar via ADB
adb connect localhost:5555
adb devices
```

### Instalação Completa (Método 2: Docker Compose)

**Passo 1: Criar docker-compose.yml**

```yaml
# docker-compose.yml
version: '3.8'

services:
  android-emulator:
    image: budtmo/docker-android:emulator_13.0
    privileged: true
    container_name: crowbar-android-emulator

    environment:
      # Device profile
      - DEVICE=Samsung Galaxy S10

      # Recursos
      - EMULATOR_TIMEOUT=300
      - RELAXED_SECURITY=true

      # Configurações de vídeo (opcional)
      - DATAPARTITION=4g

    ports:
      # ADB
      - "5555:5555"

      # noVNC Web UI
      - "6080:6080"

      # VNC Viewer
      - "5900:5900"

    devices:
      # KVM para aceleração de hardware
      - /dev/kvm

    volumes:
      # Persistir dados do emulador (opcional)
      - android-data:/data

    networks:
      - crowbar-network

    restart: unless-stopped

    healthcheck:
      test: ["CMD", "adb", "devices"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 120s

volumes:
  android-data:
    driver: local

networks:
  crowbar-network:
    driver: bridge
```

**Passo 2: Executar**

```bash
# Iniciar emulador
docker-compose up -d

# Ver logs
docker-compose logs -f android-emulator

# Parar emulador
docker-compose down

# Parar e remover volumes (reset completo)
docker-compose down -v
```

### Opções de Device Profiles

```bash
# Android 13 (API 33) - RECOMENDADO para Crowbar
budtmo/docker-android:emulator_13.0

# Android 14 (API 34) - Mais recente
budtmo/docker-android:emulator_14.0

# Android 11 (API 30) - Mais estável
budtmo/docker-android:emulator_11.0

# Android 9 (API 28) - Compatibilidade legado
budtmo/docker-android:emulator_9.0
```

### Device Profiles Disponíveis

```bash
# Configurar via variável de ambiente DEVICE

# Samsung
DEVICE="Samsung Galaxy S10"
DEVICE="Samsung Galaxy S20"
DEVICE="Samsung Galaxy S21"

# Google Pixel
DEVICE="Nexus 5"
DEVICE="Pixel 3"
DEVICE="Pixel 4"

# Padrão (se não especificado)
# Default: Nexus 5
```

### Acesso aos Recursos

**1. Web UI (noVNC)**
```
URL: http://localhost:6080
Navegador: Chrome/Firefox
Recursos:
  - Visualizar tela do emulador
  - Controlar com mouse/teclado
  - Ver logs em tempo real
```

**2. VNC Viewer (Cliente Desktop)**
```bash
# Instalar VNC Viewer
sudo apt install tigervnc-viewer -y

# Conectar
vncviewer localhost:5900
```

**3. ADB (Android Debug Bridge)**
```bash
# Conectar
adb connect localhost:5555

# Verificar conexão
adb devices
# Deve mostrar: localhost:5555  device

# Instalar APK
adb install crowbar-mobile.apk

# Executar comandos
adb shell
adb logcat
adb shell input text "Hello Crowbar"
```

### Configurações Avançadas

**docker-compose.yml completo com todas opções:**

```yaml
version: '3.8'

services:
  android-emulator:
    image: budtmo/docker-android:emulator_13.0
    privileged: true
    container_name: crowbar-android-emulator

    environment:
      # === DEVICE CONFIG ===
      - DEVICE=Samsung Galaxy S10
      - SKIN=1080x2280

      # === EMULATOR CONFIG ===
      - EMULATOR_TIMEOUT=300
      - EMULATOR_ARGS=-no-snapshot-load -no-snapshot-save -gpu swiftshader_indirect

      # === RESOURCES ===
      - DATAPARTITION=4g
      - RAM=4096

      # === NETWORK ===
      - RELAXED_SECURITY=true
      - PROXY_ENABLED=false

      # === DEBUGGING ===
      - ENABLE_VIDEO_RECORD=true
      - LOG_LEVEL=INFO

      # === TIMEZONE ===
      - TZ=America/Sao_Paulo

    ports:
      - "5555:5555"   # ADB
      - "6080:6080"   # noVNC
      - "5900:5900"   # VNC
      - "9222:9222"   # Chrome DevTools (opcional)

    devices:
      - /dev/kvm

    volumes:
      # Dados persistentes
      - android-data:/data

      # Gravações de vídeo
      - ./videos:/tmp/video

      # APKs para instalar
      - ./apks:/apks:ro

    networks:
      - crowbar-network

    restart: unless-stopped

    healthcheck:
      test: ["CMD", "adb", "devices"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 120s

    # Limites de recursos
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
        reservations:
          cpus: '2'
          memory: 4G

volumes:
  android-data:

networks:
  crowbar-network:
    driver: bridge
```

### Comandos Úteis

```bash
# === GERENCIAMENTO DO CONTAINER ===

# Ver status
docker-compose ps

# Ver logs
docker-compose logs -f

# Reiniciar emulador
docker-compose restart android-emulator

# Executar comando no container
docker-compose exec android-emulator adb devices

# === ADB COMMANDS ===

# Conectar
adb connect localhost:5555

# Listar dispositivos
adb devices -l

# Instalar APK
adb install -r /path/to/crowbar.apk

# Desinstalar app
adb uninstall com.crowbar.mobile

# Ver logs
adb logcat | grep -i crowbar

# Screenshot
adb exec-out screencap -p > screenshot.png

# Gravar tela
adb shell screenrecord /sdcard/test.mp4
adb pull /sdcard/test.mp4

# Limpar dados do app
adb shell pm clear com.crowbar.mobile

# === EMULATOR CONTROL ===

# Reiniciar emulador (dentro do container)
docker-compose exec android-emulator adb reboot

# Simular eventos
adb shell input tap 500 1000       # Toque na tela
adb shell input swipe 300 1000 300 300  # Swipe
adb shell input text "Hello"       # Digitar texto
adb shell input keyevent 3         # Home button
adb shell input keyevent 4         # Back button
```

---

## 🔬 Opção 2: Google Android Emulator Container Scripts

### Características

- **Oficial do Google**: Mantido pela equipe do Android
- **Experimental**: Ainda em desenvolvimento
- **WebRTC Support**: Acesso via navegador com WebRTC
- **GPU Acceleration**: Suporte a aceleração GPU

### Instalação

**Passo 1: Requisitos**
```bash
# Python 3 com venv
sudo apt install python3 python3-venv python3-pip -y

# Android SDK Command Line Tools
mkdir -p ~/android-sdk/cmdline-tools
cd ~/android-sdk/cmdline-tools
wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
unzip commandlinetools-linux-9477386_latest.zip
mv cmdline-tools latest

# Configurar PATH
export ANDROID_SDK_ROOT=~/android-sdk
export PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools

# Aceitar licenças
yes | sdkmanager --licenses
```

**Passo 2: Clonar Scripts**
```bash
git clone https://github.com/google/android-emulator-container-scripts.git
cd android-emulator-container-scripts
```

**Passo 3: Criar Ambiente Virtual**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Passo 4: Criar Container**
```bash
# Executar script interativo
./create_docker_image.sh

# Você será solicitado a:
# 1. Selecionar versão do Android (ex: system-images;android-30;google_apis;x86_64)
# 2. Selecionar versão do emulador
# 3. Aceitar licenças
```

**Passo 5: Executar**
```bash
# Após criação, executar
docker run --device /dev/kvm --publish 8554:8554/tcp android-emulator-image

# Acessar via navegador
# http://localhost:8554
```

### Prós e Contras

**Prós:**
- ✅ Oficial do Google
- ✅ WebRTC integrado
- ✅ GPU acceleration

**Contras:**
- ❌ Experimental (não production-ready)
- ❌ Setup mais complexo
- ❌ Menos documentação que budtmo
- ❌ Requer Android SDK completo

---

## ⚡ Opção 3: Agoda Docker Emulator

### Características

- **Foco em CI/CD**: Otimizado para pipelines
- **KVM Acceleration**: Hardware acceleration obrigatória
- **Minimal**: Sem UI gráfica (headless)

### Instalação

```bash
# Clonar repositório
git clone https://github.com/agoda-com/docker-emulator-android.git
cd docker-emulator-android

# Build custom
docker build -t agoda-android-emulator .

# Executar
docker run --privileged --device /dev/kvm \
  -p 5555:5555 \
  agoda-android-emulator
```

### Quando Usar

- ✅ **CI/CD pipelines** sem necessidade de UI
- ✅ **Testes automatizados** headless
- ❌ **Debugging visual** (use budtmo)
- ❌ **Desenvolvimento local** (use budtmo)

---

## 🧪 Integração com Detox

### Configuração Detox para Docker Emulator

**Passo 1: Atualizar package.json**

```json
{
  "detox": {
    "test-runner": "jest",
    "configurations": {
      "android.emu.debug": {
        "device": {
          "avdName": "Pixel_3_API_30"
        },
        "app": "android.debug"
      },
      "android.docker.debug": {
        "type": "android.emulator",
        "device": {
          "adbName": "localhost:5555"
        },
        "app": "android.debug"
      },
      "android.docker.release": {
        "type": "android.emulator",
        "device": {
          "adbName": "localhost:5555"
        },
        "app": "android.release"
      }
    },
    "apps": {
      "android.debug": {
        "type": "android.apk",
        "binaryPath": "android/app/build/outputs/apk/debug/app-debug.apk",
        "build": "cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug && cd .."
      },
      "android.release": {
        "type": "android.apk",
        "binaryPath": "android/app/build/outputs/apk/release/app-release.apk",
        "build": "cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release && cd .."
      }
    }
  }
}
```

**Passo 2: Script de Teste**

```bash
#!/bin/bash
# scripts/test-e2e-docker.sh

set -e

echo "=== Crowbar Mobile - E2E Tests com Docker Emulator ==="

# 1. Iniciar Docker emulator
echo "1. Iniciando Docker emulator..."
docker-compose up -d android-emulator

# 2. Aguardar emulator pronto
echo "2. Aguardando emulator ficar pronto..."
timeout 300 bash -c 'until adb connect localhost:5555 && adb shell getprop sys.boot_completed | grep -q 1; do sleep 5; done'

# 3. Verificar conexão
echo "3. Verificando conexão ADB..."
adb devices

# 4. Build APK de debug
echo "4. Building APK de debug..."
cd android
./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug
cd ..

# 5. Instalar APK
echo "5. Instalando APK no emulator..."
adb -s localhost:5555 install -r android/app/build/outputs/apk/debug/app-debug.apk

# 6. Executar testes Detox
echo "6. Executando testes Detox..."
detox test --configuration android.docker.debug

# 7. Cleanup
echo "7. Limpando..."
docker-compose down

echo "=== Testes E2E completados! ==="
```

**Passo 3: Executar Testes**

```bash
# Dar permissão de execução
chmod +x scripts/test-e2e-docker.sh

# Executar
./scripts/test-e2e-docker.sh
```

### Integração com CI/CD

**GitHub Actions Example**

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

jobs:
  e2e-android:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Enable KVM
        run: |
          echo 'KERNEL=="kvm", GROUP="kvm", MODE="0666", OPTIONS+="static_node=kvm"' | sudo tee /etc/udev/rules.d/99-kvm4all.rules
          sudo udevadm control --reload-rules
          sudo udevadm trigger --name-match=kvm

      - name: Start Android Emulator
        run: |
          docker-compose up -d android-emulator
          timeout 300 bash -c 'until adb connect localhost:5555 && adb shell getprop sys.boot_completed | grep -q 1; do sleep 5; done'

      - name: Build Android APK
        run: |
          cd android
          ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug

      - name: Run Detox Tests
        run: |
          adb connect localhost:5555
          detox test --configuration android.docker.debug

      - name: Upload Test Results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: detox-screenshots
          path: e2e/artifacts/

      - name: Cleanup
        if: always()
        run: docker-compose down
```

---

## 🔧 Troubleshooting

### Problema 1: KVM não disponível

**Erro:**
```
/dev/kvm device: permission denied
```

**Solução:**
```bash
# Adicionar usuário ao grupo kvm
sudo usermod -aG kvm $USER

# Relogar ou executar
newgrp kvm

# Verificar permissões
ls -la /dev/kvm
# Deve mostrar: crw-rw-rw- 1 root kvm

# Se necessário, ajustar permissões
sudo chmod 666 /dev/kvm
```

### Problema 2: Emulator não inicia

**Erro:**
```
emulator: ERROR: x86_64 emulation currently requires hardware acceleration!
```

**Solução:**
```bash
# Verificar se KVM está habilitado na BIOS
egrep -c '(vmx|svm)' /proc/cpuinfo
# Deve retornar > 0

# Verificar módulo KVM carregado
lsmod | grep kvm
# Deve mostrar: kvm_intel ou kvm_amd

# Carregar módulo manualmente
sudo modprobe kvm_intel  # Para Intel
# ou
sudo modprobe kvm_amd    # Para AMD

# Adicionar ao boot
echo "kvm_intel" | sudo tee -a /etc/modules
```

### Problema 3: ADB não conecta

**Erro:**
```
cannot connect to localhost:5555: Connection refused
```

**Solução:**
```bash
# 1. Verificar se container está rodando
docker ps | grep android-emulator

# 2. Verificar logs do container
docker logs android-emulator

# 3. Verificar porta exposta
docker port android-emulator 5555

# 4. Matar servidor ADB e reconectar
adb kill-server
adb start-server
adb connect localhost:5555

# 5. Verificar firewall
sudo ufw allow 5555/tcp
```

### Problema 4: Emulator muito lento

**Solução:**
```yaml
# docker-compose.yml - Aumentar recursos

services:
  android-emulator:
    environment:
      - RAM=4096           # Aumentar RAM (default: 2048)
      - CORES=4            # Aumentar CPUs (default: 2)
      - DATAPARTITION=4g   # Aumentar storage

    deploy:
      resources:
        limits:
          cpus: '4'        # Limitar CPUs
          memory: 8G       # Limitar memória
```

### Problema 5: Porta 6080 já em uso

**Erro:**
```
Bind for 0.0.0.0:6080 failed: port is already allocated
```

**Solução:**
```bash
# Opção 1: Mudar porta no docker-compose.yml
ports:
  - "6081:6080"  # Usar porta 6081 no host

# Opção 2: Matar processo usando porta
lsof -ti:6080 | xargs kill -9

# Opção 3: Usar porta aleatória
ports:
  - "6080"  # Docker escolhe porta aleatória
```

### Problema 6: Detox não encontra emulator

**Erro:**
```
DetoxRuntimeError: Cannot boot device localhost:5555
```

**Solução:**
```bash
# 1. Verificar conexão ADB
adb devices
# Deve mostrar: localhost:5555  device

# 2. Atualizar .detoxrc.json
{
  "devices": {
    "emulator": {
      "type": "android.emulator",
      "device": {
        "adbName": "localhost:5555"
      }
    }
  }
}

# 3. Forçar reconexão
adb disconnect localhost:5555
adb connect localhost:5555
adb -s localhost:5555 wait-for-device
```

### Problema 7: Emulator sem internet

**Solução:**
```bash
# Dentro do container, configurar DNS
docker exec -it android-emulator adb shell settings put global http_proxy :0

# Ou reiniciar networking
docker exec -it android-emulator adb shell svc wifi enable
docker exec -it android-emulator adb shell svc data enable

# Testar conectividade
docker exec -it android-emulator adb shell ping -c 3 8.8.8.8
```

---

## 📚 Referências

### Documentação Oficial

- **budtmo/docker-android**: https://github.com/budtmo/docker-android
- **Google Android Emulator Scripts**: https://github.com/google/android-emulator-container-scripts
- **Detox Documentation**: https://wix.github.io/Detox/
- **Android KVM**: https://developer.android.com/studio/run/emulator-acceleration

### Tutoriais e Artigos

- **Android Emulator in CI**: https://medium.com/androiddevelopers/android-emulator-in-a-ci-environment-dd65f63cdcd
- **Docker Android Testing**: https://dannyda.com/2024/08/08/android-in-docker-testing-native-apps-web-and-hybrid-apps-etc/
- **React Native E2E Detox**: https://blog.logrocket.com/react-native-end-to-end-testing-detox/

### Imagens Docker Disponíveis

```bash
# budtmo/docker-android tags
docker pull budtmo/docker-android:emulator_14.0     # Android 14 (API 34)
docker pull budtmo/docker-android:emulator_13.0     # Android 13 (API 33) - RECOMENDADO
docker pull budtmo/docker-android:emulator_12.0     # Android 12 (API 31)
docker pull budtmo/docker-android:emulator_11.0     # Android 11 (API 30)
docker pull budtmo/docker-android:emulator_10.0     # Android 10 (API 29)
docker pull budtmo/docker-android:emulator_9.0      # Android 9 (API 28)

# Ver todas tags disponíveis
# https://hub.docker.com/r/budtmo/docker-android/tags
```

---

## 🎯 Próximos Passos para Crowbar Mobile

### Fase 1: Setup Básico (1-2 horas)
- [ ] Instalar Docker e Docker Compose
- [ ] Habilitar KVM
- [ ] Criar docker-compose.yml
- [ ] Testar emulador com noVNC

### Fase 2: Integração Detox (2-3 horas)
- [ ] Atualizar configuração Detox
- [ ] Criar script de teste automatizado
- [ ] Executar primeiro teste E2E

### Fase 3: CI/CD (3-4 horas)
- [ ] Configurar GitHub Actions
- [ ] Automatizar build + teste
- [ ] Configurar relatórios de teste

### Fase 4: Otimização (contínuo)
- [ ] Ajustar recursos (RAM, CPU)
- [ ] Paralelizar testes
- [ ] Monitorar performance

---

## ✅ Checklist de Implementação

```bash
# Antes de começar
[ ] Verificar requisitos de hardware (CPU, RAM, disco)
[ ] Verificar suporte a KVM
[ ] Instalar Docker e Docker Compose
[ ] Instalar ADB

# Setup inicial
[ ] Escolher solução (budtmo recomendado)
[ ] Criar docker-compose.yml
[ ] Executar emulador pela primeira vez
[ ] Acessar via noVNC (http://localhost:6080)
[ ] Conectar via ADB

# Integração com Crowbar
[ ] Atualizar configuração Detox
[ ] Build APK de debug
[ ] Instalar APK no emulator
[ ] Executar teste E2E manual
[ ] Automatizar com script

# CI/CD (opcional)
[ ] Configurar GitHub Actions
[ ] Testar pipeline completo
[ ] Documentar processo para equipe
```

---

**Status**: ✅ Documentação completa
**Recomendação**: Começar com budtmo/docker-android (Opção 1)
**Próximo Passo**: Criar docker-compose.yml e testar setup básico

---

*Crowbar Mobile - Transformando testes em experiência consistente! 🐳📱🧪*
