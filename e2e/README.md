# E2E Tests - Crowbar Mobile

Este diretório contém os testes end-to-end (E2E) para o aplicativo Crowbar Mobile usando Detox.

## 📋 Configuração

### Pré-requisitos

#### Android
- Android SDK instalado
- ANDROID_HOME configurado
- Emulador Android criado (ou dispositivo físico conectado)
- Java 11+ instalado

#### iOS
- macOS com Xcode instalado
- Simulador iOS configurado
- CocoaPods instalado

### Instalação

```bash
# Instalar dependências
npm install

# Build para testes (Android)
npm run test:e2e:build:android

# Build para testes (iOS)
npm run test:e2e:build:ios
```

## 🏃‍♂️ Executando Testes

### Usando o Script Helper

```bash
# Executar todos os testes (Android)
npm run e2e:test

# Executar teste específico
npm run e2e:test e2e/tests/auth/login.test.js

# Executar no iOS
npm run e2e:test -- --platform=ios

# Forçar rebuild
npm run e2e:test -- --build

# Com logs detalhados
npm run e2e:test -- --debug
```

### Comandos Diretos

```bash
# Android
npm run test:e2e:android

# iOS  
npm run test:e2e:ios

# Build + Test
npm run test:e2e:build:android && npm run test:e2e:android
```

## 📁 Estrutura

```
e2e/
├── tests/              # Arquivos de teste
│   ├── auth/          # Testes de autenticação
│   ├── boxes/         # Testes de caixas misteriosas
│   ├── cart/          # Testes de carrinho
│   └── favorites/     # Testes de favoritos
├── helpers/           # Funções auxiliares
├── page-objects/      # Page Object Pattern
├── test-data/         # Dados de teste
├── reports/           # Relatórios gerados
└── setup.js           # Configuração global
```

## 🧪 Padrões de Teste

### Page Object Pattern

```javascript
// page-objects/LoginPage.js
class LoginPage extends BasePage {
  get emailInput() {
    return element(by.id('email-input'));
  }
  
  async login(email, password) {
    await this.emailInput.typeText(email);
    await this.passwordInput.typeText(password);
    await this.loginButton.tap();
  }
}
```

### Estrutura de Teste

```javascript
describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should login successfully', async () => {
    await loginPage.login('user@example.com', 'password');
    await expect(homePage.welcomeMessage).toBeVisible();
  });
});
```

## 🔧 Configurações

### Detox Config (.detoxrc.js)

- **android.emu.debug**: Android emulador (debug)
- **android.emu.release**: Android emulador (release)
- **android.att.debug**: Android dispositivo físico (debug)
- **ios.sim.debug**: iOS simulador (debug)
- **ios.sim.release**: iOS simulador (release)

### Timeouts

Configurados em `e2e/setup.js`:
- DEFAULT: 5000ms
- SLOW: 10000ms
- VERY_SLOW: 15000ms

## 📊 Relatórios

Após executar os testes, um relatório HTML é gerado em:
`e2e/reports/test-report.html`

Screenshots de falhas são salvas em:
`e2e/screenshots/`

## 🐛 Troubleshooting

### Android

**Erro: SDK location not found**
```bash
# Criar arquivo local.properties
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
```

**Erro: No emulators found**
```bash
# Listar emuladores
emulator -list-avds

# Criar emulador
# Use Android Studio > AVD Manager
```

**Erro: Build failed**
```bash
# Limpar cache
cd android && ./gradlew clean
cd .. && npm run test:e2e:build:android
```

### iOS

**Erro: No simulators found**
```bash
# Listar simuladores
xcrun simctl list devices

# Instalar simulador
# Use Xcode > Preferences > Components
```

**Erro: Build failed**
```bash
# Limpar build
cd ios && xcodebuild clean
cd .. && npm run test:e2e:build:ios
```

### Geral

**Metro bundler não está rodando**
```bash
# Em terminal separado
npm start
```

**Timeout em elementos**
```javascript
// Aumentar timeout para elemento específico
await waitFor(element(by.id('slow-element')))
  .toBeVisible()
  .withTimeout(10000);
```

## 🎯 Best Practices

1. **Use IDs únicos** para elementos testáveis
2. **Page Objects** para reutilização
3. **Dados de teste** centralizados
4. **Cleanup** após cada teste
5. **Screenshots** em falhas
6. **Logs descritivos** para debug

## 📝 Adicionando Novos Testes

1. Criar arquivo em `e2e/tests/[feature]/`
2. Importar helpers necessários
3. Usar Page Objects existentes
4. Seguir padrão de nomenclatura
5. Adicionar ao CI/CD pipeline

## 🔗 Links Úteis

- [Detox Documentation](https://wix.github.io/Detox/)
- [Jest Documentation](https://jestjs.io/)
- [React Native Testing](https://reactnative.dev/docs/testing-overview)