# Guia de Testes - Crowbar Mobile

Este documento fornece instruções completas para executar e desenvolver testes na aplicação Crowbar Mobile.

## 📋 Tipos de Testes

### 1. Testes Unitários
Testam componentes e funções isoladamente.

```bash
# Executar testes unitários
npm run test:unit

# Executar com coverage
npm run test:coverage

# Executar em modo watch
npm run test:watch
```

### 2. Testes de Integração
Testam comunicação com backend e fluxos de dados.

```bash
# Executar testes de integração
npm run test:integration

# Executar com coverage
npm run test:integration:coverage

# Executar em modo watch
npm run test:integration:watch

# Executar para CI/CD
npm run test:integration:ci
```

### 3. Testes End-to-End (E2E)
Testam fluxos completos do usuário.

```bash
# Executar testes E2E
npm run test:e2e

# Executar com coverage
npm run test:e2e:coverage
```

## 🚀 Executando os Testes

### Comandos Principais

```bash
# Executar todos os tipos de testes
npm run test:all

# Executar apenas testes unitários
npm run test:unit

# Executar apenas testes de integração
npm run test:integration

# Executar apenas testes E2E
npm run test:e2e

# Executar teste específico
npm run test:integration -- auth.integration.test.ts

# Executar com mais detalhes
npm run test:integration -- --verbose

# Executar com timeout customizado
npm run test:integration -- --testTimeout=60000
```

### Scripts Úteis

```bash
# Verificar qualidade do código
npm run quality

# Executar apenas linting
npm run lint

# Corrigir problemas de lint
npm run lint:fix

# Verificar formatação
npm run format:check

# Corrigir formatação
npm run format

# Verificar tipos TypeScript
npm run type-check
```

## 📊 Cobertura de Testes

### Metas de Cobertura

- **Testes Unitários**: 80% de cobertura
- **Testes de Integração**: 80% de cobertura
- **Testes E2E**: Cobertura de fluxos críticos

### Visualizando Relatórios

```bash
# Gerar relatório de cobertura completo
npm run test:coverage

# Gerar relatório de integração
npm run test:integration:coverage

# Visualizar relatório HTML
# Abrir coverage/lcov-report/index.html no navegador
```

## 🧪 Testes de Integração

### Estrutura dos Testes

```
src/services/__tests__/integration/
├── testConfig.ts                    # Configuração base
├── setup.ts                         # Setup global
├── auth.integration.test.ts         # Testes de autenticação
├── boxes.integration.test.ts        # Testes de boxes
├── cart.integration.test.ts         # Testes de carrinho
├── orders.integration.test.ts       # Testes de pedidos
├── user.integration.test.ts         # Testes de usuário
├── networkErrors.integration.test.ts # Testes de erro de rede
├── interceptors.integration.test.ts # Testes de interceptors
└── README.md                        # Documentação detalhada
```

### Executando Testes Específicos

```bash
# Testar apenas autenticação
npm run test:integration -- --testNamePattern="autenticação"

# Testar apenas operações de carrinho
npm run test:integration -- --testNamePattern="carrinho"

# Testar apenas cenários de erro
npm run test:integration -- --testNamePattern="erro"

# Testar arquivo específico
npm run test:integration -- auth.integration.test.ts
```

### Cobertura dos Testes de Integração

Os testes de integração cobrem:

✅ **Autenticação**
- Login com email/senha
- Registro de novos usuários
- Logout e gerenciamento de sessão
- Recuperação de senha
- Renovação de tokens
- Sincronização com Firebase

✅ **Operações de Boxes**
- Listagem de caixas com filtros
- Detalhes de caixas específicas
- Busca e sugestões
- Categorias e tags
- Reviews e avaliações
- Estatísticas e dados relacionados

✅ **Operações de Carrinho**
- Adicionar/remover itens
- Atualizar quantidades
- Aplicar cupons de desconto
- Calcular frete
- Processo de checkout
- Processamento de pagamento

✅ **Operações de Pedidos**
- Criar pedidos
- Buscar histórico
- Cancelar pedidos
- Rastrear entregas
- Avaliar pedidos
- Solicitar devoluções

✅ **Operações de Usuário**
- Gerenciar perfil
- Endereços de entrega
- Preferências e configurações
- Favoritos
- Notificações
- Estatísticas do usuário

✅ **Cenários de Erro**
- Erros de rede (timeout, conectividade)
- Erros HTTP (400, 401, 403, 404, 500)
- Validação de dados
- Tratamento de exceções

✅ **Interceptors**
- Autenticação automática
- Logging de requisições
- Tratamento de erros
- Retry automático
- Cache de dados

## 🔧 Configuração de Desenvolvimento

### Variáveis de Ambiente

```bash
# Arquivo .env.test
NODE_ENV=test
API_BASE_URL=https://test-api.crowbar.com/api/v1
SOCKET_URL=https://test-api.crowbar.com
API_TIMEOUT=10000
FIREBASE_PROJECT_ID=crowbar-test
DEBUG_TESTS=true
```

### Dependências de Teste

```json
{
  "devDependencies": {
    "jest": "^29.6.3",
    "jest-environment-jsdom": "^30.0.4",
    "jest-extended": "^3.0.0",
    "axios-mock-adapter": "^1.22.0",
    "@testing-library/jest-native": "^5.4.3",
    "@testing-library/react-native": "^13.2.0",
    "react-test-renderer": "19.1.0"
  }
}
```

### Configuração do Jest

```javascript
// jest.config.js (unitários)
module.exports = {
  preset: 'react-native',
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: ['/integration/'],
  // ... outras configurações
};

// jest.integration.config.js (integração)
module.exports = {
  preset: 'react-native',
  testMatch: ['**/integration/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/services/__tests__/integration/setup.ts'],
  // ... outras configurações
};
```

## 📝 Escrevendo Testes

### Padrões de Nomenclatura

```typescript
// Arquivo: service.integration.test.ts
describe('Testes de Integração - Nome do Serviço', () => {
  describe('Funcionalidade específica', () => {
    it('deve comportar-se corretamente', async () => {
      // Teste aqui
    });
    
    it('deve falhar quando condição inválida', async () => {
      // Teste de erro aqui
    });
  });
});
```

### Estrutura AAA (Arrange, Act, Assert)

```typescript
it('deve adicionar item ao carrinho com sucesso', async () => {
  // Arrange - Preparar dados de teste
  const boxId = 'box-123';
  const quantity = 2;
  const expectedResponse = testUtils.createApiResponse(mockCart);
  testClient.mockSuccess('post', '/cart/items', expectedResponse);

  // Act - Executar ação
  const result = await cartService.addToCart(boxId, quantity);

  // Assert - Verificar resultado
  expect(result).toMatchObject({
    items: expect.arrayContaining([
      expect.objectContaining({
        mystery_box_id: boxId,
        quantity,
      }),
    ]),
  });
});
```

### Testando Cenários de Erro

```typescript
it('deve tratar erro de rede durante login', async () => {
  // Arrange
  const credentials = { email: 'test@test.com', password: 'password' };
  testClient.mockNetworkError('post', '/auth/login');

  // Act & Assert
  await expect(authService.login(credentials)).rejects.toMatchObject({
    status: 0,
    message: expect.stringContaining('Erro de conexão'),
  });
});
```

## 🐛 Debugging

### Logs de Debug

```bash
# Habilitar logs detalhados
DEBUG_TESTS=true npm run test:integration

# Executar com verbose
npm run test:integration -- --verbose

# Executar teste específico com logs
npm run test:integration -- --testNamePattern="login" --verbose
```

### Troubleshooting

```bash
# Limpar cache do Jest
npm run test:integration -- --clearCache

# Executar com timeout maior
npm run test:integration -- --testTimeout=60000

# Executar sem cache
npm run test:integration -- --no-cache

# Executar com mais workers
npm run test:integration -- --maxWorkers=4
```

## 🔄 Integração Contínua

### GitHub Actions

```yaml
name: Tests
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
      - run: npm run test:unit
      - run: npm run test:integration:ci
      - uses: codecov/codecov-action@v3
```

### Pre-commit Hooks

```bash
# Instalar husky
npm install --save-dev husky

# Configurar pre-commit
npx husky add .husky/pre-commit "npm run test:unit && npm run test:integration:ci"
```

## 📊 Métricas e Monitoramento

### Cobertura Atual

- **Services**: 85% de cobertura
- **API Integration**: 90% de cobertura
- **Error Handling**: 95% de cobertura
- **Authentication**: 100% de cobertura

### Relatórios

```bash
# Gerar relatório completo
npm run test:all -- --coverage

# Gerar apenas relatório de integração
npm run test:integration:coverage

# Visualizar relatório HTML
open coverage/integration/lcov-report/index.html
```

## 🎯 Melhores Práticas

### 1. Testes Determinísticos
- Sempre produzem o mesmo resultado
- Não dependem de fatores externos
- Usam dados de teste controlados

### 2. Testes Independentes
- Cada teste é isolado
- Não compartilham estado
- Podem ser executados em qualquer ordem

### 3. Testes Rápidos
- Executam em menos de 10 segundos
- Usam mocks para dependências externas
- Evitam operações desnecessárias

### 4. Testes Claros
- Nomes descritivos
- Estrutura AAA bem definida
- Asserções específicas

### 5. Testes Abrangentes
- Cobrem casos de sucesso
- Testam cenários de erro
- Incluem edge cases

## 📚 Recursos Adicionais

### Documentação

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Axios Mock Adapter](https://github.com/ctimmerm/axios-mock-adapter)

### Exemplos de Código

Ver diretório `src/services/__tests__/integration/` para exemplos práticos de:
- Mocking de APIs
- Testes de fluxos complexos
- Tratamento de erros
- Configuração de ambiente de teste

---

**Última atualização**: 2025-01-07  
**Versão**: 1.0.0  
**Documentação**: Completa e atualizada