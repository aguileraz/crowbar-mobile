# Docker Android Emulator - Guia Rápido 🚀

**5 minutos para começar a testar Crowbar Mobile com Docker!**

---

## ⚡ Início Rápido (TL;DR)

```bash
# 1. Verificar pré-requisitos
ls -la /dev/kvm && docker --version && adb --version

# 2. Iniciar emulador
docker-compose -f docker-compose.android-emulator.yml up -d

# 3. Aguardar inicialização (2-3 minutos)
# Acesse http://localhost:6080 para ver o emulador

# 4. Executar testes E2E
./scripts/test-e2e-docker.sh

# 5. Parar emulador
docker-compose -f docker-compose.android-emulator.yml down
```

---

## 📋 Pré-requisitos

### Verificação Automática

```bash
# Execute este script para verificar tudo de uma vez
cat << 'EOF' > check-requirements.sh
#!/bin/bash
echo "=== Verificação de Pré-requisitos ==="
command -v docker &> /dev/null && echo "✅ Docker" || echo "❌ Docker"
command -v docker-compose &> /dev/null && echo "✅ Docker Compose" || echo "❌ Docker Compose"
[ -e /dev/kvm ] && echo "✅ KVM" || echo "❌ KVM"
command -v adb &> /dev/null && echo "✅ ADB" || echo "❌ ADB"
command -v node &> /dev/null && echo "✅ Node.js" || echo "❌ Node.js"
EOF

chmod +x check-requirements.sh
./check-requirements.sh
```

### Instalação Rápida (Ubuntu/Debian)

**Se faltar algo, execute:**

```bash
# Docker + Docker Compose
sudo apt update
sudo apt install docker.io docker-compose -y
sudo usermod -aG docker $USER

# KVM
sudo apt install qemu-kvm libvirt-daemon-system -y
sudo usermod -aG kvm $USER

# ADB
sudo apt install android-sdk-platform-tools -y

# Node.js (se necessário)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# IMPORTANTE: Relogar após adicionar aos grupos
newgrp docker
newgrp kvm
```

---

## 🎮 Uso Básico

### Opção 1: Script Automatizado (RECOMENDADO)

```bash
# Executar testes E2E completos
./scripts/test-e2e-docker.sh

# Opções úteis
./scripts/test-e2e-docker.sh --skip-build      # Pular build APK
./scripts/test-e2e-docker.sh --keep-running    # Manter emulador rodando
./scripts/test-e2e-docker.sh --debug           # Logs verbosos
./scripts/test-e2e-docker.sh --help            # Ver todas opções
```

### Opção 2: Comandos Manuais

```bash
# 1. Iniciar emulador
docker-compose -f docker-compose.android-emulator.yml up -d

# 2. Aguardar boot (2-3 minutos)
# Monitorar logs
docker logs -f crowbar-android-emulator

# 3. Conectar ADB
adb connect localhost:5555
adb devices

# 4. Build APK
cd android
./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug
cd ..

# 5. Instalar APK
adb -s localhost:5555 install -r android/app/build/outputs/apk/debug/app-debug.apk

# 6. Executar testes Detox
detox test --configuration android.docker.debug

# 7. Parar emulador
docker-compose -f docker-compose.android-emulator.yml down
```

---

## 🌐 Acesso ao Emulador

### Via Navegador (noVNC)

```
URL: http://localhost:6080
```

**Você verá:**
- Tela do Android em tempo real
- Controle com mouse/teclado
- Logs do sistema

### Via VNC Viewer (Desktop)

```bash
# Instalar VNC viewer
sudo apt install tigervnc-viewer -y

# Conectar
vncviewer localhost:5900
```

### Via ADB (Linha de Comando)

```bash
# Conectar
adb connect localhost:5555

# Comandos úteis
adb devices                              # Listar dispositivos
adb shell                                # Shell interativo
adb logcat | grep -i crowbar            # Ver logs do app
adb shell input text "Hello"            # Digitar texto
adb shell input tap 500 1000            # Tocar na tela
adb install -r app.apk                  # Instalar APK
adb uninstall com.crowbar.mobile        # Desinstalar app
```

---

## 🧪 Executar Testes

### Testes E2E com Detox

```bash
# Método 1: Script automatizado (FÁCIL)
./scripts/test-e2e-docker.sh

# Método 2: Comando Detox direto
detox test --configuration android.docker.debug

# Método 3: Com opções avançadas
detox test \
  --configuration android.docker.debug \
  --loglevel trace \
  --take-screenshots all \
  --record-logs all
```

### Configurações Disponíveis

```bash
# Debug (com logs)
detox test --configuration android.docker.debug

# Release (otimizado)
detox test --configuration android.docker.release

# Teste específico
detox test e2e/firstTest.e2e.js --configuration android.docker.debug

# Rerun failed tests
detox test --configuration android.docker.debug --reuse
```

---

## 🛠️ Comandos Úteis

### Gerenciamento do Emulador

```bash
# Ver status
docker-compose -f docker-compose.android-emulator.yml ps

# Ver logs
docker-compose -f docker-compose.android-emulator.yml logs -f

# Reiniciar
docker-compose -f docker-compose.android-emulator.yml restart

# Parar
docker-compose -f docker-compose.android-emulator.yml down

# Parar e remover volumes (reset completo)
docker-compose -f docker-compose.android-emulator.yml down -v

# Ver recursos usados
docker stats crowbar-android-emulator
```

### Debugging

```bash
# Entrar no container
docker exec -it crowbar-android-emulator bash

# Ver processos do Android
docker exec -it crowbar-android-emulator adb shell ps

# Screenshot
adb exec-out screencap -p > screenshot.png

# Gravar tela (30s)
adb shell screenrecord --time-limit 30 /sdcard/test.mp4
adb pull /sdcard/test.mp4

# Limpar cache do app
adb shell pm clear com.crowbar.mobile

# Forçar parada do app
adb shell am force-stop com.crowbar.mobile
```

---

## 🚨 Troubleshooting Rápido

### Problema: KVM não disponível

```bash
# Verificar
ls -la /dev/kvm

# Solução
sudo usermod -aG kvm $USER
newgrp kvm
sudo chmod 666 /dev/kvm
```

### Problema: ADB não conecta

```bash
# Reiniciar ADB
adb kill-server
adb start-server
adb connect localhost:5555
```

### Problema: Emulador muito lento

```bash
# Editar docker-compose.android-emulator.yml
# Aumentar RAM e CPUs:

environment:
  - RAM=4096        # ou 8192
  - CORES=4         # ou mais

deploy:
  resources:
    limits:
      cpus: '4'     # ou mais
      memory: 8G    # ou mais
```

### Problema: Porta 6080 ocupada

```bash
# Ver quem está usando
lsof -ti:6080

# Mudar porta no docker-compose.yml
ports:
  - "6081:6080"  # Usar 6081 no host
```

### Problema: Emulador não inicia

```bash
# Ver logs detalhados
docker logs crowbar-android-emulator

# Verificar recursos
docker stats

# Recriar do zero
docker-compose -f docker-compose.android-emulator.yml down -v
docker-compose -f docker-compose.android-emulator.yml up -d
```

---

## 📊 Recursos e Performance

### Recursos Padrão

```yaml
CPUs: 4 (limite) / 2 (garantido)
RAM: 8GB (limite) / 4GB (garantido)
Disco: ~10GB para imagem + dados
```

### Ajustar para Máquina Fraca

```yaml
# docker-compose.android-emulator.yml

environment:
  - RAM=2048        # Reduzir para 2GB
  - CORES=2         # Apenas 2 CPUs

deploy:
  resources:
    limits:
      cpus: '2'
      memory: 4G
    reservations:
      cpus: '1'
      memory: 2G
```

### Ajustar para Máquina Potente

```yaml
# docker-compose.android-emulator.yml

environment:
  - RAM=8192        # 8GB RAM
  - CORES=8         # 8 CPUs

deploy:
  resources:
    limits:
      cpus: '8'
      memory: 16G
    reservations:
      cpus: '4'
      memory: 8G
```

---

## 🔄 Workflows Comuns

### Workflow 1: Desenvolvimento Iterativo

```bash
# 1. Iniciar emulador (uma vez)
docker-compose -f docker-compose.android-emulator.yml up -d

# 2. Fazer mudanças no código

# 3. Testar mudanças (rápido, sem rebuild)
./scripts/test-e2e-docker.sh --skip-build --keep-running

# Repetir passos 2-3 quantas vezes necessário

# 4. Ao terminar
docker-compose -f docker-compose.android-emulator.yml down
```

### Workflow 2: CI/CD Completo

```bash
# Tudo em um comando (build + teste + cleanup)
./scripts/test-e2e-docker.sh
```

### Workflow 3: Debug Visual

```bash
# 1. Iniciar e manter rodando
docker-compose -f docker-compose.android-emulator.yml up -d

# 2. Abrir noVNC no navegador
xdg-open http://localhost:6080

# 3. Instalar app manualmente
adb connect localhost:5555
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# 4. Testar manualmente via noVNC

# 5. Debug com ADB
adb logcat | grep -i crowbar
```

---

## 📚 Próximos Passos

1. **Ler Documentação Completa**: `docs/DOCKER-ANDROID-EMULATOR.md`
2. **Configurar CI/CD**: Ver exemplos de GitHub Actions
3. **Otimizar Performance**: Ajustar recursos conforme necessário
4. **Integrar com Pipeline**: Automatizar testes em cada PR

---

## 💡 Dicas Profissionais

### Tip 1: Alias Úteis

```bash
# Adicionar ao ~/.bashrc ou ~/.zshrc

alias droid-start='docker-compose -f docker-compose.android-emulator.yml up -d'
alias droid-stop='docker-compose -f docker-compose.android-emulator.yml down'
alias droid-logs='docker logs -f crowbar-android-emulator'
alias droid-test='./scripts/test-e2e-docker.sh'
alias droid-adb='adb connect localhost:5555 && adb devices'
alias droid-vnc='xdg-open http://localhost:6080'
```

### Tip 2: Watch Mode para Desenvolvimento

```bash
# Terminal 1: Emulador rodando
droid-start

# Terminal 2: Metro bundler
npm start

# Terminal 3: Watch tests (rerun on change)
npm run test:watch

# Terminal 4: ADB logs
adb logcat | grep -i crowbar
```

### Tip 3: Salvar Estado do Emulador

```bash
# Commitar volume do emulador
docker commit crowbar-android-emulator crowbar-android-snapshot

# Restaurar snapshot
docker run --rm -it crowbar-android-snapshot
```

### Tip 4: Paralelizar Testes

```bash
# Rodar múltiplos emuladores (portas diferentes)
docker-compose -f docker-compose.android-emulator.yml up -d --scale android-emulator=3

# Configurar Detox para workers
detox test --configuration android.docker.debug --workers 3
```

---

## 🎯 Checklist de Uso Diário

```bash
✅ Pré-requisitos
[ ] KVM habilitado
[ ] Docker rodando
[ ] ADB instalado

✅ Primeira Execução
[ ] Criar docker-compose.yml
[ ] Executar script de teste
[ ] Verificar noVNC funcionando

✅ Desenvolvimento
[ ] Emulador iniciado
[ ] ADB conectado
[ ] Metro bundler rodando
[ ] Testes passando

✅ Antes de Commitar
[ ] Todos testes E2E passando
[ ] Sem console.log/warnings
[ ] APK build com sucesso
[ ] Emulador parado (cleanup)
```

---

## 📞 Suporte

- **Documentação Completa**: `docs/DOCKER-ANDROID-EMULATOR.md`
- **GitHub Issues**: https://github.com/budtmo/docker-android/issues
- **Detox Docs**: https://wix.github.io/Detox/

---

**Status**: ✅ Pronto para uso
**Última Atualização**: 2025-11-06
**Versão**: 1.0.0

*Crowbar Mobile - Testando com confiança! 🐳📱✅*
