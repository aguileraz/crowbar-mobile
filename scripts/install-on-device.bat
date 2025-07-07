@echo off
echo 📱 Instalando Crowbar Mobile no Dispositivo Android
echo ================================================

echo 🔍 Verificando dispositivos conectados...
"%ANDROID_HOME%\platform-tools\adb.exe" devices

echo.
echo 📦 Instalando APK no dispositivo...
echo ⚠️  IMPORTANTE: Aceite a instalação no seu celular quando aparecer a notificação!

"%ANDROID_HOME%\platform-tools\adb.exe" install -r "android\app\build\outputs\apk\debug\app-debug.apk"

if %ERRORLEVEL% equ 0 (
    echo ✅ App instalado com sucesso!
    echo 🚀 Iniciando o app...
    "%ANDROID_HOME%\platform-tools\adb.exe" shell am start -n com.crowbarmobile/.MainActivity
) else (
    echo ❌ Falha na instalação!
    echo.
    echo 🔧 SOLUÇÕES:
    echo 1. No seu celular, vá em Configurações ^> Segurança
    echo 2. Ative "Instalar apps desconhecidos" para ADB
    echo 3. Aceite a notificação de instalação quando aparecer
    echo 4. Execute este script novamente
)

echo.
echo 📋 Comandos úteis:
echo    Ver logs: adb logcat ^| findstr ReactNativeJS
echo    Recarregar app: adb shell input keyevent 82

pause
