# 🚀 Crowbar Mobile - Guia de Deploy

Este documento descreve o processo completo de deploy do aplicativo Crowbar Mobile para produção.

## 📋 Índice

- [Pré-requisitos](#pré-requisitos)
- [Configuração de Ambientes](#configuração-de-ambientes)
- [Build de Produção](#build-de-produção)
- [Deploy para Stores](#deploy-para-stores)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoramento](#monitoramento)
- [Troubleshooting](#troubleshooting)

## 🔧 Pré-requisitos

### Ferramentas Necessárias

#### Para Android:
- **Java 17** ou superior
- **Android SDK** (API 33+)
- **Android Studio** (recomendado)
- **Gradle** (incluído no projeto)

#### Para iOS:
- **macOS** (obrigatório)
- **Xcode 14** ou superior
- **CocoaPods**
- **Apple Developer Account**

#### Geral:
- **Node.js 18** ou superior
- **npm** ou **yarn**
- **Git**
- **React Native CLI**

### Contas e Certificados

#### Android:
- Conta no **Google Play Console**
- **Keystore** de produção configurado
- **Service Account** para API do Google Play

#### iOS:
- **Apple Developer Account** (pago)
- **Certificados de distribuição**
- **Provisioning Profiles**
- **App Store Connect** configurado

## 🌍 Configuração de Ambientes

O projeto suporta três ambientes:

### Development
```bash
npm run env:dev
```
- API local
- Debug habilitado
- Mock de pagamentos
- Firebase de desenvolvimento

### Staging
```bash
npm run env:staging
```
- API de staging
- Analytics habilitado
- Testes de pagamento
- Firebase de staging

### Production
```bash
npm run env:prod
```
- API de produção
- Otimizações máximas
- Pagamentos reais
- Firebase de produção

## 🏗️ Build de Produção

### Scripts Disponíveis

```bash
# Build Android
npm run build:android

# Build iOS
npm run build:ios

# Build ambas as plataformas
npm run build:both

# Build de staging
npm run build:staging

# Build de produção
npm run build:production
```

### Build Manual

#### Android

1. **Preparar ambiente:**
```bash
cd android
cp gradle.properties.example gradle.properties
# Editar gradle.properties com suas configurações
```

2. **Configurar keystore:**
```bash
# Gerar keystore (apenas uma vez)
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias crowbar-key -keyalg RSA -keysize 2048 -validity 10000

# Configurar no gradle.properties
MYAPP_UPLOAD_STORE_FILE=release.keystore
MYAPP_UPLOAD_STORE_PASSWORD=sua_senha
MYAPP_UPLOAD_KEY_ALIAS=crowbar-key
MYAPP_UPLOAD_KEY_PASSWORD=sua_senha
```

3. **Build:**
```bash
# AAB para Google Play
./gradlew bundleRelease

# APK para testes
./gradlew assembleRelease
```

#### iOS

1. **Preparar certificados:**
```bash
# Instalar certificados no Keychain
# Baixar provisioning profiles do Apple Developer
```

2. **Configurar Xcode:**
```bash
cd ios
pod install
```

3. **Build:**
```bash
# Archive
xcodebuild archive \
  -workspace CrowbarMobile.xcworkspace \
  -scheme CrowbarMobile \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath build/CrowbarMobile.xcarchive

# Export IPA
xcodebuild -exportArchive \
  -archivePath build/CrowbarMobile.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath build/
```

## 📱 Deploy para Stores

### Google Play Store

#### Primeira Submissão

1. **Criar app no Google Play Console**
2. **Configurar informações do app:**
   - Nome: Crowbar Mobile
   - Descrição
   - Screenshots
   - Ícone
   - Política de privacidade

3. **Upload do AAB:**
```bash
# Via Google Play Console (manual)
# Ou via API (automatizado)
```

#### Atualizações

```bash
# Incrementar versionCode e versionName
# android/app/build.gradle

# Build e upload
npm run build:android
# Upload via Console ou API
```

### Apple App Store

#### Primeira Submissão

1. **Criar app no App Store Connect**
2. **Configurar informações do app:**
   - Nome: Crowbar Mobile
   - Descrição
   - Screenshots
   - Ícone
   - Política de privacidade

3. **Upload via Xcode ou Transporter:**
```bash
# Via Xcode
# Product > Archive > Distribute App

# Via Transporter
xcrun altool --upload-app \
  --type ios \
  --file "CrowbarMobile.ipa" \
  --username "seu@email.com" \
  --password "app-specific-password"
```

#### Atualizações

```bash
# Incrementar CFBundleVersion e CFBundleShortVersionString
# ios/CrowbarMobile/Info.plist

# Build e upload
npm run build:ios
# Upload via Xcode ou Transporter
```

## 🔄 CI/CD Pipeline

### GitHub Actions

O projeto inclui pipeline automatizado em `.github/workflows/ci.yml`:

#### Triggers:
- **Push** para `main` ou `develop`
- **Pull Request** para `main` ou `develop`
- **Release** publicado

#### Jobs:
1. **Lint e Testes** - ESLint, TypeScript, Jest
2. **Security Scan** - npm audit, Snyk
3. **Build Android** - APK/AAB
4. **Build iOS** - Archive/IPA
5. **E2E Tests** - Detox
6. **Deploy Staging** - Firebase App Distribution
7. **Deploy Production** - Google Play + App Store

#### Secrets Necessários:

```bash
# Android
ANDROID_KEYSTORE          # Base64 do keystore
ANDROID_KEY_ALIAS         # Alias da chave
ANDROID_STORE_PASSWORD    # Senha do keystore
ANDROID_KEY_PASSWORD      # Senha da chave
GOOGLE_PLAY_SERVICE_ACCOUNT # JSON do service account

# iOS
BUILD_CERTIFICATE_BASE64   # Certificado de distribuição
P12_PASSWORD              # Senha do certificado
BUILD_PROVISION_PROFILE_BASE64 # Provisioning profile
KEYCHAIN_PASSWORD         # Senha do keychain temporário
APPSTORE_ISSUER_ID        # App Store Connect API
APPSTORE_API_KEY_ID       # App Store Connect API
APPSTORE_API_PRIVATE_KEY  # App Store Connect API

# Firebase
FIREBASE_SERVICE_ACCOUNT   # Service account do Firebase
FIREBASE_ANDROID_APP_ID    # ID do app Android
FIREBASE_IOS_APP_ID        # ID do app iOS

# Notificações
SLACK_WEBHOOK             # Webhook do Slack

# Security
SNYK_TOKEN                # Token do Snyk
```

### Configurar Secrets

```bash
# GitHub CLI
gh secret set ANDROID_KEYSTORE < keystore.base64
gh secret set ANDROID_KEY_ALIAS --body "crowbar-key"
# ... outros secrets
```

## 📊 Monitoramento

### Firebase Analytics
- Eventos de usuário
- Conversões
- Performance

### Crashlytics
- Crashes em tempo real
- Relatórios de erro
- Stack traces

### Performance Monitoring
- Tempos de carregamento
- Uso de rede
- Métricas customizadas

### Alertas
- Slack para builds
- Email para crashes críticos
- Dashboard de métricas

## 🔧 Troubleshooting

### Problemas Comuns

#### Android

**Erro de assinatura:**
```bash
# Verificar configuração do keystore
keytool -list -v -keystore release.keystore

# Verificar gradle.properties
cat android/gradle.properties
```

**Build falha:**
```bash
# Limpar cache
cd android
./gradlew clean
./gradlew --stop

# Verificar versões
./gradlew --version
```

#### iOS

**Certificado inválido:**
```bash
# Verificar certificados
security find-identity -v -p codesigning

# Atualizar provisioning profiles
rm -rf ~/Library/MobileDevice/Provisioning\ Profiles/*
# Baixar novamente do Apple Developer
```

**Build falha:**
```bash
# Limpar build
cd ios
xcodebuild clean -workspace CrowbarMobile.xcworkspace -scheme CrowbarMobile

# Atualizar pods
pod deintegrate
pod install
```

### Logs e Debug

#### Android
```bash
# Logs do dispositivo
adb logcat | grep CrowbarMobile

# Logs do build
./gradlew bundleRelease --info
```

#### iOS
```bash
# Logs do simulador
xcrun simctl spawn booted log stream --predicate 'process == "CrowbarMobile"'

# Logs do build
xcodebuild -workspace CrowbarMobile.xcworkspace -scheme CrowbarMobile archive -verbose
```

## 📞 Suporte

Para problemas de deploy:

1. **Verificar logs** do CI/CD
2. **Consultar documentação** oficial das plataformas
3. **Abrir issue** no repositório
4. **Contatar equipe** de DevOps

---

**Última atualização:** Janeiro 2025  
**Versão:** 1.0.0
