# Keycloak Mocks - Quick Reference Card

> **Referência Rápida** para uso dos mocks Keycloak OAuth2/OIDC
> **Sprint 9 - Semana 1** | Última atualização: 2025-11-10

## 📦 Imports

```typescript
// Mock principal
import {
  authorize,
  refresh,
  revoke,
  logout,
  __mockHelpers,
} from '__mocks__/react-native-app-auth';

// Helpers de teste
import {
  setupSuccessfulLogin,
  setupNetworkError,
  setupInvalidCredentials,
  setupAuthenticatedUser,
  resetMock,
  expectValidAuthResult,
  decodeIDToken,
  TEST_KEYCLOAK_CONFIG,
  TEST_USERS,
} from '__mocks__/keycloakTestHelpers';
```

## 🎯 Cenários Comuns

### 1. Login Bem-Sucedido

```typescript
it('deve fazer login', async () => {
  setupSuccessfulLogin('default');
  const result = await authorize(TEST_KEYCLOAK_CONFIG);
  expectValidAuthResult(result);
});
```

### 2. Login com Admin

```typescript
it('deve fazer login como admin', async () => {
  setupSuccessfulLogin('admin');
  const result = await authorize(TEST_KEYCLOAK_CONFIG);
  const payload = decodeIDToken(result.idToken);
  expect(payload.roles).toContain('admin');
});
```

### 3. Erro de Rede

```typescript
it('deve falhar com erro de rede', async () => {
  setupNetworkError();
  await expect(authorize(TEST_KEYCLOAK_CONFIG)).rejects.toThrow(
    'Network request failed'
  );
});
```

### 4. Credenciais Inválidas

```typescript
it('deve rejeitar credenciais inválidas', async () => {
  setupInvalidCredentials();
  await expect(authorize(TEST_KEYCLOAK_CONFIG)).rejects.toThrow(
    'Invalid credentials'
  );
});
```

### 5. Token Refresh

```typescript
it('deve renovar token', async () => {
  setupAuthenticatedUser('default');
  const tokens = getMockTokens();
  const result = await refresh(TEST_KEYCLOAK_CONFIG, {
    refreshToken: tokens!.refreshToken,
  });
  expect(result.accessToken).toBeDefined();
});
```

### 6. Logout

```typescript
it('deve fazer logout', async () => {
  setupAuthenticatedUser('default');
  const tokens = getMockTokens();
  await logout(TEST_KEYCLOAK_CONFIG, { idToken: tokens!.idToken });
  expect(isMockAuthenticated()).toBe(false);
});
```

### 7. Token Expirado

```typescript
it('deve renovar token expirado', async () => {
  setupAuthenticatedUser('default');
  __mockHelpers.expireAccessToken();
  const token = await keycloakService.getAccessToken();
  expect(token).not.toBeNull(); // Renovado automaticamente
});
```

### 8. Simulação de Latência

```typescript
it('deve mostrar loading', async () => {
  setupNetworkLatency(1000);
  const promise = keycloakService.login();
  expect(screen.getByTestId('loading')).toBeTruthy();
  await promise;
});
```

## 🔧 Funções Helper

### Setup de Cenários

| Função | Descrição |
|--------|-----------|
| `setupSuccessfulLogin(userType)` | Login bem-sucedido |
| `setupNetworkError()` | Falha de rede |
| `setupInvalidCredentials()` | Credenciais inválidas |
| `setupTimeout()` | Timeout de requisição |
| `setupServerError()` | Erro 500 do servidor |
| `setupNetworkLatency(ms)` | Simula latência de rede |
| `setupAuthenticatedUser(userType)` | Usuário já autenticado |
| `setupUnauthenticatedUser()` | Usuário não autenticado |

### Verificações

| Função | Descrição |
|--------|-----------|
| `isMockAuthenticated()` | Retorna se está autenticado |
| `getMockTokens()` | Retorna tokens atuais |
| `getMockState()` | Retorna estado completo |
| `resetMock()` | Limpa todo estado |

### Assertions

| Função | Descrição |
|--------|-----------|
| `expectValidAuthResult(result)` | Valida resultado de auth |
| `expectValidJWT(token)` | Valida formato JWT |
| `decodeIDToken(token)` | Decodifica ID token |

## 👤 Usuários Mock

```typescript
TEST_USERS = {
  default: {
    email: 'usuario@exemplo.com',
    name: 'João Silva',
    roles: ['user'],
    email_verified: true,
  },
  admin: {
    email: 'admin@exemplo.com',
    name: 'Maria Administradora',
    roles: ['admin', 'user'],
    email_verified: true,
  },
  unverified: {
    email: 'nao.verificado@exemplo.com',
    name: 'Pedro Não Verificado',
    roles: ['user'],
    email_verified: false,
  },
}
```

## 🎭 Helpers Avançados

### Configurar Tipo de Usuário

```typescript
__mockHelpers.setUserType('admin');
```

### Forçar Falha

```typescript
__mockHelpers.setNextRequestToFail('network');
```

### Configurar Delay

```typescript
__mockHelpers.setRequestDelay(2000);
```

### Expirar Token

```typescript
__mockHelpers.expireAccessToken();
```

### Definir Tokens Manualmente

```typescript
__mockHelpers.setTokens({
  accessToken: 'custom_token',
  refreshToken: 'custom_refresh',
  idToken: 'custom_id_token',
  tokenType: 'Bearer',
  accessTokenExpirationDate: new Date().toISOString(),
  scopes: ['openid'],
});
```

## ⚙️ Setup/Teardown Padrão

```typescript
describe('Meu Teste', () => {
  beforeEach(() => {
    resetMock();
  });

  afterEach(() => {
    resetMock();
  });

  // Seus testes aqui
});
```

## 📝 Exemplo Completo

```typescript
import keycloakService from '@/services/keycloakService';
import {
  setupSuccessfulLogin,
  resetMock,
  expectValidAuthResult,
  decodeIDToken,
  TEST_USERS,
} from '__mocks__/keycloakTestHelpers';

describe('Keycloak Authentication', () => {
  beforeEach(() => {
    resetMock();
  });

  afterEach(() => {
    resetMock();
  });

  it('deve fazer login e obter user info', async () => {
    // Arrange
    setupSuccessfulLogin('admin');

    // Act
    const result = await keycloakService.login();
    const userInfo = await keycloakService.getUserInfo();

    // Assert
    expectValidAuthResult(result);
    expect(userInfo.email).toBe(TEST_USERS.admin.email);
    expect(userInfo.roles).toContain('admin');

    // Verificar ID token
    const payload = decodeIDToken(result.idToken);
    expect(payload.email_verified).toBe(true);
  });

  it('deve lidar com erro de rede', async () => {
    // Arrange
    setupNetworkError();

    // Act & Assert
    await expect(keycloakService.login()).rejects.toThrow(
      'Network request failed'
    );

    // Verificar que não está autenticado
    const isAuth = await keycloakService.isAuthenticated();
    expect(isAuth).toBe(false);
  });
});
```

## 🔍 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Mock não funciona | Verificar `jest.config.js` moduleNameMapper |
| Estado persiste | Usar `resetMock()` no `afterEach` |
| Token null | Usar `setupAuthenticatedUser()` antes |
| Loading não aparece | Usar `act()` do Testing Library |

## 📚 Documentação Completa

Para documentação detalhada, consulte:
- `docs/KEYCLOAK-MOCKS-GUIDE.md` - Guia completo
- `__mocks__/react-native-app-auth.ts` - Implementação do mock
- `__mocks__/keycloakTestHelpers.ts` - Helpers de teste
- `src/test/mocks/keycloak-mock-examples.test.ts` - Exemplos

---

**Versão**: 1.0.0
**Última Atualização**: 2025-11-10
**Sprint**: 9 - Semana 1 (Keycloak Migration)
