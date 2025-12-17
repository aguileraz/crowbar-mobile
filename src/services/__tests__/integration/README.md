# Testes de Integração - Crowbar Mobile

Este diretório contém testes de integração abrangentes para verificar a comunicação com o backend da aplicação Crowbar Mobile.

## 📋 Visão Geral

Os testes de integração verificam:

- **Comunicação com API**: Testa todos os endpoints e fluxos de dados
- **Autenticação Keycloak**: Testa fluxo completo de autenticação OAuth2/OIDC
- **MFA (Multi-Factor Auth)**: Testa habilitar, desabilitar e verificar status MFA
- **Notificações Gotify**: Testa recebimento e exibição de notificações push
- **Tratamento de erros**: Valida comportamento em cenários de falha
- **Interceptors**: Verifica funcionamento correto dos interceptors HTTP
- **Resiliência**: Valida comportamento em cenários de rede instável

## 🧪 Estrutura dos Testes

### Arquivos de Teste

```
src/services/__tests__/integration/
├── testConfig.ts                    # Configuração base para testes
├── setup.ts                         # Setup global do Jest
├── auth.integration.test.ts         # Testes de autenticação Keycloak
├── mfa.integration.test.ts          # Testes de MFA (Multi-Factor Auth)
├── gotify.integration.test.ts       # Testes de notificações Gotify
├── boxes.integration.test.ts        # Testes de operações de boxes
├── cart.integration.test.ts         # Testes de operações de carrinho
├── orders.integration.test.ts       # Testes de operações de pedidos
├── user.integration.test.ts         # Testes de operações de usuário
├── networkErrors.integration.test.ts # Testes de erros de rede
├── interceptors.integration.test.ts # Testes de interceptors
└── README.md                        # Este arquivo
```

### Configuração de Testes

- **`testConfig.ts`**: Configuração centralizada, mocks e utilitários
- **`setup.ts`**: Configuração global do Jest e mocks do React Native
- **`jest.integration.config.js`**: Configuração específica do Jest para integração

## 🚀 Executando os Testes

### Comandos Disponíveis

```bash
# Executar todos os testes de integração
npm run test:integration

# Executar testes com coverage
npm run test:integration:coverage

# Executar testes em modo watch
npm run test:integration:watch

# Executar teste específico
npm run test:integration -- auth.integration.test.ts

# Executar testes com verbose
npm run test:integration -- --verbose

# Executar testes com timeout customizado
npm run test:integration -- --testTimeout=60000
```

### Configuração dos Scripts no package.json

```json
{
  "scripts": {
    "test:integration": "jest --config jest.integration.config.js",
    "test:integration:watch": "jest --config jest.integration.config.js --watch",
    "test:integration:coverage": "jest --config jest.integration.config.js --coverage",
    "test:integration:ci": "jest --config jest.integration.config.js --ci --coverage --watchAll=false"
  }
}
```

## 📊 Cobertura de Testes

### Metas de Cobertura

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Relatórios de Cobertura

Os relatórios são gerados em:
- `coverage/integration/lcov-report/index.html` - Relatório HTML
- `coverage/integration/lcov.info` - Relatório LCOV
- Console - Relatório de texto

## 🔧 Configuração de Ambiente

### Variáveis de Ambiente para Testes

```bash
NODE_ENV=test
API_BASE_URL=https://test-api.crowbar.com/api/v1
SOCKET_URL=https://test-api.crowbar.com
API_TIMEOUT=10000
FIREBASE_PROJECT_ID=crowbar-test
# ... outras variáveis
```

### Dependências Necessárias

```json
{
  "devDependencies": {
    "axios-mock-adapter": "^1.22.0",
    "jest": "^29.5.0",
    "jest-extended": "^3.0.0",
    "react-native-testing-library": "^6.0.0",
    "babel-jest": "^29.5.0"
  }
}
```

## 📝 Escrevendo Novos Testes

### Estrutura Padrão

```typescript
import { TestApiClient, testEnvironment, testData, testUtils } from './testConfig';
import { serviceToTest } from '../../serviceToTest';

describe('Testes de Integração - Nome do Serviço', () => {
  let testClient: TestApiClient;

  beforeAll(() => {
    testEnvironment.setup();
  });

  afterAll(() => {
    testEnvironment.teardown();
  });

  beforeEach(() => {
    testClient = new TestApiClient();
  });

  afterEach(() => {
    testClient.clearMocks();
    jest.clearAllMocks();
  });

  describe('Funcionalidade específica', () => {
    it('deve comportar-se corretamente', async () => {
      // Arrange
      const expectedResponse = testUtils.createApiResponse(testData.example);
      testClient.mockSuccess('get', '/endpoint', expectedResponse);

      // Act
      const result = await serviceToTest.method();

      // Assert
      expect(result).toMatchObject(expectedResponse.data);
    });
  });
});
```

### Padrões de Nomenclatura

- **Arquivos**: `*.integration.test.ts`
- **Describe**: `'Testes de Integração - Nome do Serviço'`
- **It**: Use verbos no presente: `'deve fazer algo'`
- **Variáveis**: Use nomes descritivos: `expectedResponse`, `testClient`

### Mocks e Utilitários

```typescript
// Mock de sucesso
testClient.mockSuccess('get', '/endpoint', response);

// Mock de erro HTTP
testClient.mockHttpError('post', '/endpoint', 400, errorResponse);

// Mock de erro de rede
testClient.mockNetworkError('get', '/endpoint');

// Mock de timeout
testClient.mockTimeout('post', '/endpoint');

// Criar response paginado
const paginatedResponse = testUtils.createPaginatedResponse(data, page, perPage);

// Criar response padrão da API
const apiResponse = testUtils.createApiResponse(data, success, message);
```

## 🧬 Tipos de Testes

### 1. Testes de Funcionalidade

Verificam se os serviços funcionam conforme esperado:

```typescript
it('deve obter lista de caixas com sucesso', async () => {
  // Arrange
  const expectedResponse = testUtils.createPaginatedResponse(testBoxes);
  testClient.mockSuccess('get', '/boxes', expectedResponse);

  // Act
  const response = await boxService.getBoxes();

  // Assert
  expect(response.data).toHaveLength(2);
  expect(response.data[0]).toMatchObject({
    id: 'box-electronics-001',
    name: 'Caixa Eletrônicos Premium',
  });
});
```

### 2. Testes de Erro

Verificam tratamento adequado de erros:

```typescript
it('deve falhar com credenciais inválidas', async () => {
  // Arrange
  testClient.mockHttpError('post', '/auth/login', 401, {
    success: false,
    message: 'Credenciais inválidas',
  });

  // Act & Assert
  await expect(authService.login(credentials)).rejects.toMatchObject({
    status: 401,
    message: 'Credenciais inválidas',
  });
});
```

### 3. Testes de Interceptors

Verificam funcionamento correto dos interceptors:

```typescript
it('deve adicionar token de autenticação automaticamente', async () => {
  // Arrange
  const token = 'test-token-123';
  apiClient.setAuthToken(token);

  // Mock para interceptar o request
  const axiosInstance = testClient.getAxiosInstance();
  let capturedAuthHeader = '';

  axiosInstance.interceptors.request.use((config) => {
    capturedAuthHeader = config.headers.Authorization || '';
    return config;
  });

  // Act
  await userService.getProfile();

  // Assert
  expect(capturedAuthHeader).toBe(`Bearer ${token}`);
});
```

## 📈 Métricas e Monitoramento

### Métricas Coletadas

- **Cobertura de código**: Linhas, funções, branches
- **Performance**: Tempo de execução dos testes
- **Confiabilidade**: Taxa de falha dos testes
- **Qualidade**: Complexidade e manutenibilidade

### Relatórios

```bash
# Gerar relatório de cobertura
npm run test:integration:coverage

# Gerar relatório de performance
npm run test:integration -- --profile

# Gerar relatório detalhado
npm run test:integration -- --verbose --coverage
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Timeout nos testes**
   ```bash
   # Aumentar timeout
   npm run test:integration -- --testTimeout=60000
   ```

2. **Mocks não funcionando**
   ```typescript
   // Verificar se clearMocks está sendo chamado
   afterEach(() => {
     testClient.clearMocks();
     jest.clearAllMocks();
   });
   ```

3. **Erros de importação**
   ```typescript
   // Verificar paths no jest.integration.config.js
   moduleNameMapping: {
     '^@/(.*)$': '<rootDir>/src/$1',
   }
   ```

### Logs de Debug

```typescript
// Habilitar logs em testes
beforeEach(() => {
  if (process.env.DEBUG_TESTS) {
    console.log = jest.fn();
    console.error = jest.fn();
  }
});
```

## 🔄 Integração Contínua

### GitHub Actions

```yaml
name: Integration Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:integration:ci
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/integration/lcov.info
```

### Hooks de Pre-commit

```bash
# Executar testes antes do commit
npm run test:integration:ci
```

## 📚 Recursos Adicionais

### Documentação

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Axios Mock Adapter](https://github.com/ctimmerm/axios-mock-adapter)

### Melhores Práticas

1. **Testes determinísticos**: Sempre produzem o mesmo resultado
2. **Testes independentes**: Não dependem uns dos outros
3. **Testes rápidos**: Executam em menos de 10 segundos
4. **Testes claros**: Nomes descritivos e estrutura AAA (Arrange, Act, Assert)
5. **Testes abrangentes**: Cobrem casos de sucesso, erro e edge cases

### Padrões de Commit

```bash
# Adicionar novos testes
git commit -m "test: add integration tests for user service"

# Corrigir testes existentes
git commit -m "fix: update integration tests for auth service"

# Melhorar configuração de testes
git commit -m "chore: improve integration test setup"
```

---

**Última atualização**: 2025-01-07  
**Versão**: 1.0.0  
**Autor**: Claude AI Assistant