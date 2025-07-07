@echo off
echo 🔧 Criando Emulador Android Minimo para Desenvolvimento
echo =====================================================

REM Verificar se Android SDK existe
if not exist "%ANDROID_HOME%\cmdline-tools\latest\bin\avdmanager.bat" (
    echo ❌ Android SDK não encontrado!
    echo Verifique se ANDROID_HOME está configurado: %ANDROID_HOME%
    pause
    exit /b 1
)

echo 📱 Criando emulador otimizado "CrowbarDev"...

REM Criar AVD com configurações mínimas
"%ANDROID_HOME%\cmdline-tools\latest\bin\avdmanager.bat" create avd ^
    -n "CrowbarDev" ^
    -k "system-images;android-33;google_apis;x86_64" ^
    -d "pixel_2" ^
    --force

if %ERRORLEVEL% neq 0 (
    echo ❌ Erro ao criar emulador!
    echo Tentando com API 30...
    
    "%ANDROID_HOME%\cmdline-tools\latest\bin\avdmanager.bat" create avd ^
        -n "CrowbarDev" ^
        -k "system-images;android-30;google_apis;x86_64" ^
        -d "pixel_2" ^
        --force
)

REM Configurar emulador para usar menos espaço
set AVD_CONFIG="%USERPROFILE%\.android\avd\CrowbarDev.avd\config.ini"

echo 🔧 Otimizando configurações do emulador...

REM Adicionar configurações otimizadas
echo hw.ramSize=1024 >> %AVD_CONFIG%
echo vm.heapSize=128 >> %AVD_CONFIG%
echo disk.dataPartition.size=1024MB >> %AVD_CONFIG%
echo hw.gpu.enabled=yes >> %AVD_CONFIG%
echo hw.gpu.mode=host >> %AVD_CONFIG%
echo hw.keyboard=yes >> %AVD_CONFIG%
echo showDeviceFrame=no >> %AVD_CONFIG%

echo ✅ Emulador "CrowbarDev" criado com sucesso!
echo 🚀 Para iniciar: emulator -avd CrowbarDev

echo.
echo 📋 Comandos úteis:
echo    Listar emuladores: emulator -list-avds
echo    Iniciar emulador:  emulator -avd CrowbarDev
echo    Verificar dispositivos: adb devices

pause
