# E2E Testing - Crowbar Mobile

Este diretório contém a configuração e testes End-to-End (E2E) para o aplicativo Crowbar Mobile.

## 📋 Configuração

### Arquivos de Configuração

- **`.detoxrc.js`** (raiz do projeto): Configuração principal do Detox
- **`jest.config.js`**: Configuração para testes E2E reais com Detox
- **`jest.config.mock.js`**: Configuração para testes de validação sem emulador
- **`setup.js`**: Setup global para testes E2E (com fallback para mock)
- **`setup.mock.js`**: Setup mock completo para testes sem emulador

### Configurações de Dispositivo

O Detox está configurado para suportar:

- **iOS Simulator**: iPhone 15 (Debug/Release)
- **Android Emulator**: Pixel_3a_API_30_x86 (Debug/Release)
- **Android Device**: Dispositivos físicos conectados (Debug/Release)

## 🧪 Tipos de Teste

### 1. Testes de Configuração (Mock)
Validam se o ambiente E2E está configurado corretamente sem precisar de emulador.

```bash
# Executar testes de configuração
cd e2e && npx jest --config jest.config.mock.js

# Testar arquivo específico
cd e2e && npx jest tests/config.test.js --config jest.config.mock.js
```

### 2. Testes E2E Reais
Executam testes no aplicativo real usando emulador/dispositivo.

```bash
# Android (Emulador)
npx detox test --configuration android.emu.debug

# Android (Dispositivo)
npx detox test --configuration android.att.debug

# iOS (Simulador)
npx detox test --configuration ios.sim.debug
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