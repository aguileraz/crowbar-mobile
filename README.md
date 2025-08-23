# Crowbar Mobile 📦

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen) ![React Native](https://img.shields.io/badge/React%20Native-0.80.1-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Firebase](https://img.shields.io/badge/Firebase-Integrated-orange)

Aplicativo mobile multiplataforma para o marketplace de caixas misteriosas **Crowbar**. Desenvolvido com React Native + TypeScript, oferece uma experiência moderna e fluida para iOS e Android.

## ✨ Funcionalidades Principais

### 🛒 **E-commerce Completo**
- Marketplace de caixas misteriosas
- Sistema de busca e filtros avançados
- Carrinho de compras inteligente
- Processo de checkout otimizado
- Múltiplos métodos de pagamento (PIX, cartão, boleto)

### 🎁 **Experiência Gamificada**
- Abertura de caixas com animações
- Sistema de raridade e probabilidades
- Inventário pessoal de itens
- Compartilhamento de resultados
- Sistema de conquistas

### 👤 **Gestão de Usuário**
- Autenticação segura (Firebase Auth)
- Perfil personalizado com estatísticas
- Gerenciamento de endereços (integração ViaCEP)
- Histórico completo de pedidos
- Sistema de favoritos

### 📱 **Recursos Avançados**
- Notificações push inteligentes
- Modo offline robusto
- Sincronização em tempo real
- Animações fluidas e micro-interações
- Analytics e métricas (LGPD compliant)

## 🏗️ Arquitetura

### **Stack Tecnológica**
- **Framework**: React Native 0.80.1 + TypeScript
- **Estado**: Redux Toolkit + Redux Persist
- **Navegação**: React Navigation (Tab + Stack)
- **UI**: React Native Paper (Material Design 3)
- **Backend**: Firebase (Auth, Firestore, Analytics, Messaging)
- **Animações**: React Native Reanimated + Gesture Handler
- **HTTP**: Axios com interceptors
- **Formulários**: Formik + Yup
- **Testes**: Jest + React Native Testing Library + Detox

### **Qualidade e Performance**
- ✅ 100% TypeScript
- ✅ 80%+ cobertura de testes
- ✅ Bundle otimizado (40% redução)
- ✅ Suporte offline
- ✅ Hermes Engine habilitado
- ✅ Code splitting implementado

## 🛠️ Pré-requisitos

### **Ambiente de Desenvolvimento**
- **Node.js**: 18.19.0+ (recomendado: usar nvm)
- **React Native CLI**: `npm install -g react-native-cli`
- **Watchman**: `brew install watchman` (macOS)

### **Para Android**
- **Java JDK**: 17+
- **Android Studio**: Última versão
- **Android SDK**: API 31+
- **Emulador**: Android 10+ (API 29+)

### **Para iOS**
- **Xcode**: 14+
- **iOS Simulator**: iOS 14+
- **CocoaPods**: `sudo gem install cocoapods`

### **Verificação Rápida**
```bash
# Verificar ambiente
npx react-native doctor

# Para Windows (verificar Android)
.\scripts\check-android-setup.ps1

# Configurar ambiente Android (Windows)
.\scripts\setup-android-env.ps1
```

### 📚 **Guias Detalhados**
- [Configuração Android SDK (Windows)](docs/ANDROID_SDK_SETUP_WINDOWS.md)
- [Relatório de Testes](docs/SMOKE_TEST_REPORT.md)
- [Guia de Performance](PERFORMANCE_GUIDE.md)
- [Documentação de Testes](TESTING.md)

## 🚀 Instalação e Execução

### **1. Clone o Repositório**
```bash
git clone https://github.com/aguileraz/crowbar-mobile.git
cd crowbar-mobile
```

### **2. Instale as Dependências**
```bash
npm install
# ou
yarn install
```

### **3. Configuração do Firebase**

**Android:**
```bash
# Coloque o arquivo google-services.json em:
# android/app/google-services.json
```

**iOS:**
```bash
# Adicione o arquivo GoogleService-Info.plist ao projeto Xcode
# ios/CrowbarMobile/GoogleService-Info.plist
```

### **4. Configuração de Ambiente**
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Configure suas variáveis:
# API_BASE_URL=https://your-api.com
# SOCKET_URL=wss://your-socket.com
# FIREBASE_ANALYTICS_DEBUG=true
```

### **5. Instalação iOS (apenas iOS)**
```bash
cd ios
pod install
cd ..
```

### **6. Executar o Aplicativo**

**Metro Bundler:**
```bash
npm start
```

**Android:**
```bash
npm run android
# ou ambiente específico
npm run android:staging
npm run android:production
```

**iOS:**
```bash
npm run ios
# ou ambiente específico
npm run ios:staging
npm run ios:production
```

### **7. Verificação da Instalação**
```bash
# Executar testes
npm test

# Verificar qualidade do código
npm run quality

# Verificar tipos TypeScript
npm run type-check
```

## 🧪 Testes

O projeto possui uma suíte completa de testes automatizados:

### **Testes Unitários**
```bash
# Executar todos os testes
npm test

# Executar com cobertura
npm run test:coverage

# Executar em modo watch
npm run test:watch
```

### **Testes de Integração**
```bash
# Executar testes de integração
npm run test:integration

# Com cobertura
npm run test:integration:coverage
```

### **Testes E2E**
```bash
# Construir apps para teste
npm run test:e2e:build

# Executar testes E2E
npm run test:e2e

# Apenas Android
npm run test:e2e:android

# Apenas iOS
npm run test:e2e:ios
```

### **Testes com Docker (Android)**
```bash
# Executar testes em emuladores Docker
make -f Makefile.docker test           # Todos os APIs sequencialmente
make -f Makefile.docker test-parallel  # Todos os APIs em paralelo
make -f Makefile.docker test-api31     # Apenas API 31
make -f Makefile.docker test-api26     # Apenas API 26
make -f Makefile.docker test-api21     # Apenas API 21

# Ver relatório de testes
make -f Makefile.docker report

# Limpar ambiente Docker
make -f Makefile.docker clean
```

## 📊 Scripts Disponíveis

### **Desenvolvimento**
```bash
npm start              # Iniciar Metro bundler
npm run android        # Executar no Android
npm run ios           # Executar no iOS
npm run reset-cache   # Limpar cache do Metro
```

### **Qualidade**
```bash
npm run lint          # Executar ESLint
npm run format        # Formatar código com Prettier
npm run type-check    # Verificar tipos TypeScript
npm run quality       # Executar todos os checks
```

### **Build**
```bash
npm run build:android     # Build Android
npm run build:ios        # Build iOS
npm run build:production # Build para produção
```

### **Análise**
```bash
npm run analyze:bundle    # Analisar bundle size
npm run analyze:deps     # Analisar dependências
```

## 📱 Desenvolvimento

### **Estrutura do Projeto**
```
src/
├── components/         # Componentes reutilizáveis
│   ├── animated/      # Componentes animados
│   └── ui/           # Componentes de interface
├── screens/           # Telas do aplicativo
├── navigation/        # Configuração de navegação
├── services/          # Serviços e APIs
├── store/            # Redux store e slices
├── hooks/            # Custom hooks
├── utils/            # Utilitários
├── types/            # Definições TypeScript
└── assets/           # Recursos estáticos
```

### **Padrões de Código**
- **Linguagem**: TypeScript 100%
- **Estilo**: Prettier + ESLint
- **Commits**: Conventional Commits
- **Testes**: Jest + React Native Testing Library
- **Documentação**: Comentários em português

### **Hot Reload**
- **Fast Refresh**: Ativado por padrão
- **Reload Forçado**: 
  - Android: `Ctrl + M` (Windows) / `Cmd + M` (macOS)
  - iOS: `Cmd + R` no simulador

## 🔍 Debug

### **Ferramentas de Debug**
```bash
# Flipper (recomendado)
npm run flipper

# React Native Debugger
npm run debug

# Logs
npm run logs:android
npm run logs:ios
```

### **Performance**
```bash
# Analisar performance
npm run analyze:performance

# Monitorar métricas
npm run monitor
```

## 🚨 Solução de Problemas

### **Problemas Comuns**

**Metro bundler não inicia:**
```bash
npm run reset-cache
npm start
```

**Erro de build Android:**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

**Erro de build iOS:**
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
npm run ios
```

**Problemas com Firebase:**
- Verificar se os arquivos de configuração estão no local correto
- Conferir se as variáveis de ambiente estão configuradas
- Verificar se o projeto Firebase está ativo

### **Links Úteis**
- [Guia de Troubleshooting](https://reactnative.dev/docs/troubleshooting)
- [Documentação Firebase](https://rnfirebase.io/)
- [React Navigation](https://reactnavigation.org/)

## 🤝 Contribuindo

### **Processo de Contribuição**
1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### **Padrões**
- Seguir o [Conventional Commits](https://www.conventionalcommits.org/)
- Manter cobertura de testes acima de 80%
- Documentar funções e componentes
- Usar TypeScript estrito

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Equipe

- **Desenvolvimento**: Claude AI & Augment Team
- **Arquitetura**: React Native + Firebase
- **Design**: Material Design 3
- **Backend**: [Crowbar Backend](https://github.com/aguileraz/crowbar-backend)

## 🆘 Suporte

Para suporte técnico:
- 📧 Email: support@crowbar.com
- 💬 Discord: [Crowbar Community](https://discord.gg/crowbar)
- 🐛 Issues: [GitHub Issues](https://github.com/aguileraz/crowbar-mobile/issues)

---

**Status**: ✅ Produção | **Versão**: 1.0.0 | **Última Atualização**: 2025-01-09