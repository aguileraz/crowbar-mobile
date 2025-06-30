# ENVIRONMENT SETUP - Crowbar Mobile

## ✅ **AMBIENTE ATUAL VERIFICADO**

### **Node.js e NPM**
- ✅ **Node.js**: v24.2.0 (✅ Compatível - requer v18.19.0+)
- ✅ **NPM**: v11.3.0 (✅ Atualizado)

### **React Native CLI**
- ⚠️ **Status**: Precisa ser instalado globalmente
- **Comando**: `npm install -g @react-native-community/cli`

## 📋 **CHECKLIST DE AMBIENTE**

### **✅ CONCLUÍDO**
- [x] Node.js v18.19.0+ instalado
- [x] NPM funcionando

### **⏳ PENDENTE**
- [ ] React Native CLI instalado globalmente
- [ ] Android Studio configurado
- [ ] Xcode configurado (macOS)
- [ ] Emuladores/simuladores funcionais
- [ ] Watchman instalado (recomendado)

## 🛠️ **PRÓXIMOS PASSOS**

### **1. Instalar React Native CLI**
```bash
npm install -g @react-native-community/cli
```

### **2. Verificar Instalação**
```bash
npx react-native --version
```

### **3. Configurar Android Studio**
- Instalar Android Studio
- Configurar Android SDK
- Criar AVD (Android Virtual Device)

### **4. Configurar Xcode (macOS)**
- Instalar Xcode via App Store
- Instalar Command Line Tools
- Configurar iOS Simulator

### **5. Instalar Watchman (Opcional)**
```bash
# macOS
brew install watchman

# Windows
# Baixar do site oficial
```

## 🎯 **VALIDAÇÃO**

Para validar o ambiente, execute:
```bash
npx react-native doctor
```

## 📝 **NOTAS**
- Ambiente Windows detectado
- Node.js versão superior ao mínimo (excelente)
- React Native CLI será instalado durante criação do projeto
- Android Studio será necessário para desenvolvimento Android

**Status**: ✅ AMBIENTE BASE CONFIGURADO
**Próxima Ação**: Instalar React Native CLI e criar projeto
**Data**: 2025-01-30
