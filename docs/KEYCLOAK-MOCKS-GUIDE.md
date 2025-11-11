# Guia de Mocks Keycloak OAuth2/OIDC

> **Sprint 9 - Semana 1**: Migração de autenticação Firebase → Keycloak
> **Última Atualização**: 2025-11-10
> **Autor**: sprint9-keycloak-mocker agent

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquivos Criados](#arquivos-criados)
- [Estrutura dos Mocks](#estrutura-dos-mocks)
- [Métodos Mockados](#métodos-mockados)
- [Guia de Uso](#guia-de-uso)
- [Cenários de Teste](#cenários-de-teste)
- [Exemplos Práticos](#exemplos-práticos)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Este guia documenta os mocks completos para **react-native-app-auth** (SDK Keycloak OAuth2/OIDC) criados para suportar testes unitários e de integração no Crowbar Mobile após a migração do Firebase Auth para Keycloak.

### O que foi substituído?

| Antes (Firebase) | Depois (Keycloak) |
|------------------|-------------------|
| `signInWithEmailAndPassword()` | `authorize()` (OAuth2 flow) |
| `signOut()` | `logout()` + `revoke()` |
| `onAuthStateChanged()` | `isAuthenticated()` + token checking |
| `getIdToken()` | `getAccessToken()` + refresh automático |
| Firebase SDK mocks | react-native-app-auth mocks |

### Por que estes mocks foram criados?

1. **Isolamento de Testes**: Testes não dependem de servidor Keycloak real
2. **Velocidade**: Testes executam instantaneamente (sem rede)
3. **Reprodutibilidade**: Cenários de erro facilmente reproduzíveis
4. **Cobertura**: Testa todos os edge cases (timeout, network error, etc.)

---

## 📁 Arquivos Criados

### 1. `__mocks__/react-native-app-auth.ts`

Mock principal que substitui a biblioteca `react-native-app-auth`.

**Localização**: `/mnt/overpower/apps/dev/agl/crowbar/crowbar-mobile/__mocks__/react-native-app-auth.ts`

**Responsabilidades**:
- Mock de todos os métodos OAuth2/OIDC
- Geração de JWTs realistas
- Simulação de estados de autenticação
- Helpers internos para controle de comportamento

### 2. `__mocks__/keycloakTestHelpers.ts`

Utilitários de teste para facilitar configuração de cenários.

**Localização**: `/mnt/overpower/apps/dev/agl/crowbar/crowbar-mobile/__mocks__/keycloakTestHelpers.ts`

**Responsabilidades**:
- Funções para setup de cenários comuns
- Assertions customizadas
- Dados de teste reutilizáveis
- Utilitários de verificação de estado

### 3. `docs/KEYCLOAK-MOCKS-GUIDE.md`

Este documento de documentação completa.

---

## 🏗️ Estrutura dos Mocks

### Tipos e Interfaces

```typescript
interface AuthConfiguration {
  issuer?: string;
  clientId: string;
  redirectUrl: string;
  scopes: string[];
  serviceConfiguration?: ServiceConfiguration;
}

interface AuthorizeResult {
  accessToken: string;
  accessTokenExpirationDate: string;
  idToken: string;
  refreshToken: string;
  tokenType: string;
  scopes: string[];
}
```

### Usuários Mock Disponíveis

```typescript
MOCK_USERS = {
  default: {
    sub: 'keycloak-user-123',
    email: 'usuario@exemplo.com',
    name: 'João Silva',
    roles: ['user'],
    email_verified: true,
  },
  admin: {
    sub: 'keycloak-admin-456',
    email: 'admin@exemplo.com',
    name: 'Maria Administradora',
    roles: ['admin', 'user'],
    email_verified: true,
  },
  unverified: {
    sub: 'keycloak-unverified-789',
    email: 'nao.verificado@exemplo.com',
    name: 'Pedro Não Verificado',
    roles: ['user'],
    email_verified: false,
  },
}
```

### Estado Interno do Mock

```typescript
interface MockState {
  isAuthenticated: boolean;
  currentUser: 'default' | 'admin' | 'unverified';
  tokens: AuthorizeResult | null;
  shouldFailNextRequest: boolean;
  failureType: 'network' | 'invalid_credentials' | 'timeout' | 'server_error' | null;
  requestDelay: number;
}
```

---

## 🔧 Métodos Mockados

### 1. `authorize(config: AuthConfiguration)`

**OAuth2 Authorization Code Flow completo**

```typescript
const result = await authorize({
  issuer: 'https://keycloak.crowbar.com.br/realms/crowbar',
  clientId: 'crowbar-mobile',
  redirectUrl: 'crowbar://oauth/callback',
  scopes: ['openid', 'profile', 'email'],
});

// Result:
// {
//   accessToken: 'mock_access_token_xyz123',
//   refreshToken: 'mock_refresh_token_abc456',
//   idToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
//   tokenType: 'Bearer',
//   accessTokenExpirationDate: '2025-12-31T23:59:59Z',
//   scopes: ['openid', 'profile', 'email', 'offline_access'],
// }
```

**Comportamento**:
- ✅ Gera tokens realistas (JWT format)
- ✅ Simula delay de rede se configurado
- ✅ Pode falhar com erros específicos
- ✅ Atualiza estado interno de autenticação

### 2. `refresh(config: AuthConfiguration, { refreshToken: string })`

**Renovar access token usando refresh token**

```typescript
const result = await refresh(config, {
  refreshToken: 'mock_refresh_token_abc456',
});

// Result:
// {
//   accessToken: 'mock_refreshed_access_token_new123',
//   refreshToken: 'mock_refresh_token_abc456', // Pode ser novo
//   idToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
//   tokenType: 'Bearer',
//   accessTokenExpirationDate: '2025-12-31T23:59:59Z',
// }
```

**Comportamento**:
- ✅ Valida refresh token fornecido
- ✅ Gera novo access token
- ✅ Opcionalmente gera novo refresh token
- ⚠️ Falha se refresh token inválido

### 3. `revoke(config: AuthConfiguration, { tokenToRevoke: string })`

**Revogar access ou refresh token**

```typescript
await revoke(config, {
  tokenToRevoke: 'mock_access_token_xyz123',
  sendClientId: true,
});

// Limpa estado de autenticação
```

**Comportamento**:
- ✅ Marca token como inválido
- ✅ Limpa estado interno de autenticação
- ✅ Simula revogação no servidor Keycloak

### 4. `logout(config: AuthConfiguration, { idToken: string })`

**Logout completo (OIDC End Session)**

```typescript
await logout(config, {
  idToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  postLogoutRedirectUrl: 'crowbar://logout/callback',
});

// Limpa sessão e tokens
```

**Comportamento**:
- ✅ Encerra sessão no Keycloak
- ✅ Limpa todos os tokens
- ✅ Opcionalmente redireciona após logout

---

## 📖 Guia de Uso

### Setup Básico

```typescript
// No topo do seu arquivo de teste
import keycloakService from '@/services/keycloakService';
import {
  setupSuccessfulLogin,
  resetMock,
  expectValidAuthResult,
} from '../../__mocks__/keycloakTestHelpers';

describe('Keycloak Authentication', () => {
  beforeEach(() => {
    resetMock(); // Limpar estado antes de cada teste
  });

  afterEach(() => {
    resetMock(); // Limpar estado após cada teste
  });
});
```

### Teste de Login Bem-Sucedido

```typescript
it('deve fazer login com sucesso', async () => {
  // Arrange
  setupSuccessfulLogin('default');

  // Act
  const result = await keycloakService.login();

  // Assert
  expectValidAuthResult(result);
  expect(result.accessToken).toBeDefined();
  expect(result.idToken).toBeDefined();
  expect(result.refreshToken).toBeDefined();
});
```

### Teste de Login com Usuário Admin

```typescript
it('deve fazer login como admin', async () => {
  // Arrange
  setupSuccessfulLogin('admin');

  // Act
  const result = await keycloakService.login();
  const userInfo = await keycloakService.getUserInfo();

  // Assert
  expect(userInfo.roles).toContain('admin');
  expect(userInfo.email).toBe('admin@exemplo.com');
});
```

### Teste de Erro de Rede

```typescript
it('deve lidar com erro de rede', async () => {
  // Arrange
  setupNetworkError();

  // Act & Assert
  await expect(keycloakService.login()).rejects.toThrow(
    'Network request failed'
  );
});
```

### Teste de Credenciais Inválidas

```typescript
it('deve rejeitar credenciais inválidas', async () => {
  // Arrange
  setupInvalidCredentials();

  // Act & Assert
  await expect(keycloakService.login()).rejects.toThrow(
    'Invalid credentials'
  );
});
```

### Teste de Token Refresh

```typescript
it('deve renovar token expirado automaticamente', async () => {
  // Arrange
  setupAuthenticatedUser('default');
  __mockHelpers.expireAccessToken(); // Forçar expiração

  // Act
  const token = await keycloakService.getAccessToken();

  // Assert
  expect(token).not.toBeNull();
  // Deve ter chamado refresh() automaticamente
});
```

### Teste de Logout

```typescript
it('deve fazer logout e limpar tokens', async () => {
  // Arrange
  setupAuthenticatedUser('default');
  expect(await keycloakService.isAuthenticated()).toBe(true);

  // Act
  await keycloakService.logout();

  // Assert
  expect(await keycloakService.isAuthenticated()).toBe(false);
  expect(getMockTokens()).toBeNull();
});
```

---

## 🎭 Cenários de Teste

### Cenário 1: Login Bem-Sucedido (Happy Path)

```typescript
import {
  setupSuccessfulLogin,
  expectValidAuthResult,
  decodeIDToken,
} from '../../__mocks__/keycloakTestHelpers';

it('deve completar fluxo de login com sucesso', async () => {
  // Setup
  setupSuccessfulLogin('default');

  // Executar login
  const result = await keycloakService.login();

  // Verificar resultado
  expectValidAuthResult(result);

  // Verificar ID token
  const payload = decodeIDToken(result.idToken);
  expect(payload.email).toBe('usuario@exemplo.com');
  expect(payload.email_verified).toBe(true);

  // Verificar que está autenticado
  const isAuth = await keycloakService.isAuthenticated();
  expect(isAuth).toBe(true);
});
```

### Cenário 2: Erro de Rede

```typescript
import { setupNetworkError } from '../../__mocks__/keycloakTestHelpers';

it('deve mostrar mensagem de erro de rede', async () => {
  // Setup
  setupNetworkError();

  // Executar e verificar erro
  await expect(keycloakService.login()).rejects.toThrow(
    'Network request failed'
  );

  // Verificar que não está autenticado
  const isAuth = await keycloakService.isAuthenticated();
  expect(isAuth).toBe(false);
});
```

### Cenário 3: Timeout de Requisição

```typescript
import { setupTimeout } from '../../__mocks__/keycloakTestHelpers';

it('deve lidar com timeout', async () => {
  // Setup
  setupTimeout();

  // Executar e verificar erro
  await expect(keycloakService.login()).rejects.toThrow('timeout');
});
```

### Cenário 4: Erro do Servidor (500)

```typescript
import { setupServerError } from '../../__mocks__/keycloakTestHelpers';

it('deve lidar com erro 500', async () => {
  // Setup
  setupServerError();

  // Executar e verificar erro
  await expect(keycloakService.login()).rejects.toThrow('500');
});
```

### Cenário 5: Simulação de Latência

```typescript
import {
  setupNetworkLatency,
  resetMock,
} from '../../__mocks__/keycloakTestHelpers';

it('deve mostrar loading durante requisição', async () => {
  // Setup com 1 segundo de delay
  setupNetworkLatency(1000);

  // Iniciar login (não await ainda)
  const loginPromise = keycloakService.login();

  // Verificar que loading está visível
  expect(screen.getByTestId('loading-spinner')).toBeTruthy();

  // Aguardar conclusão
  await loginPromise;

  // Verificar que loading sumiu
  expect(screen.queryByTestId('loading-spinner')).toBeNull();
});
```

### Cenário 6: Token Expirado com Refresh Automático

```typescript
import {
  setupAuthenticatedUser,
  __mockHelpers,
} from '../../__mocks__/keycloakTestHelpers';

it('deve renovar token expirado automaticamente', async () => {
  // Setup: usuário já autenticado
  setupAuthenticatedUser('default');

  // Forçar expiração do access token
  __mockHelpers.expireAccessToken();

  // Tentar obter token (deve renovar automaticamente)
  const token = await keycloakService.getAccessToken();

  // Verificar que token foi renovado
  expect(token).not.toBeNull();
  expect(token).not.toBe('mock_access_token_existing_default'); // Token novo
});
```

### Cenário 7: Múltiplos Perfis de Usuário

```typescript
import {
  setupSuccessfulLogin,
  decodeIDToken,
  TEST_USERS,
} from '../../__mocks__/keycloakTestHelpers';

describe('Perfis de usuário', () => {
  it('deve autenticar usuário padrão', async () => {
    setupSuccessfulLogin('default');
    const result = await keycloakService.login();
    const payload = decodeIDToken(result.idToken);

    expect(payload.email).toBe(TEST_USERS.default.email);
    expect(payload.roles).toEqual(['user']);
  });

  it('deve autenticar usuário admin', async () => {
    setupSuccessfulLogin('admin');
    const result = await keycloakService.login();
    const payload = decodeIDToken(result.idToken);

    expect(payload.email).toBe(TEST_USERS.admin.email);
    expect(payload.roles).toContain('admin');
  });

  it('deve autenticar usuário não verificado', async () => {
    setupSuccessfulLogin('unverified');
    const result = await keycloakService.login();
    const payload = decodeIDToken(result.idToken);

    expect(payload.email_verified).toBe(false);
  });
});
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Teste de Componente de Login

```typescript
// src/screens/Auth/__tests__/LoginScreen.test.tsx

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import LoginScreen from '../LoginScreen';
import {
  setupSuccessfulLogin,
  setupInvalidCredentials,
  resetMock,
} from '../../../__mocks__/keycloakTestHelpers';

describe('LoginScreen', () => {
  beforeEach(() => {
    resetMock();
  });

  it('deve fazer login com sucesso', async () => {
    // Arrange
    setupSuccessfulLogin('default');
    const { getByTestId } = render(<LoginScreen />);

    // Act
    fireEvent.press(getByTestId('login-button'));

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Login bem-sucedido')).toBeTruthy();
    });
  });

  it('deve mostrar erro de credenciais inválidas', async () => {
    // Arrange
    setupInvalidCredentials();
    const { getByTestId } = render(<LoginScreen />);

    // Act
    fireEvent.press(getByTestId('login-button'));

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/credenciais inválidas/i)).toBeTruthy();
    });
  });
});
```

### Exemplo 2: Teste de Redux Slice

```typescript
// src/store/slices/__tests__/authSlice.test.ts

import authReducer, {
  loginAsync,
  logoutAsync,
  refreshTokenAsync,
} from '../authSlice';
import {
  setupSuccessfulLogin,
  setupAuthenticatedUser,
  resetMock,
} from '../../../__mocks__/keycloakTestHelpers';

describe('authSlice', () => {
  beforeEach(() => {
    resetMock();
  });

  it('deve atualizar estado após login bem-sucedido', async () => {
    // Arrange
    setupSuccessfulLogin('default');
    const initialState = { user: null, isAuthenticated: false };

    // Act
    const result = await loginAsync();
    const newState = authReducer(initialState, result);

    // Assert
    expect(newState.isAuthenticated).toBe(true);
    expect(newState.user).toBeDefined();
    expect(newState.user?.email).toBe('usuario@exemplo.com');
  });

  it('deve limpar estado após logout', async () => {
    // Arrange
    setupAuthenticatedUser('default');
    const authenticatedState = {
      user: { email: 'usuario@exemplo.com' },
      isAuthenticated: true,
    };

    // Act
    const result = await logoutAsync();
    const newState = authReducer(authenticatedState, result);

    // Assert
    expect(newState.isAuthenticated).toBe(false);
    expect(newState.user).toBeNull();
  });
});
```

### Exemplo 3: Teste de Integração com API

```typescript
// src/services/__tests__/integration/auth.integration.test.ts

import keycloakService from '../../keycloakService';
import apiClient from '../../httpClient';
import {
  setupSuccessfulLogin,
  setupAuthenticatedUser,
  resetMock,
} from '../../../__mocks__/keycloakTestHelpers';

describe('Auth Integration', () => {
  beforeEach(() => {
    resetMock();
  });

  it('deve adicionar token ao header das requisições', async () => {
    // Arrange
    setupAuthenticatedUser('default');
    const token = await keycloakService.getAccessToken();

    // Act
    await apiClient.get('/api/protected-resource');

    // Assert
    expect(apiClient.defaults.headers.common['Authorization']).toBe(
      `Bearer ${token}`
    );
  });

  it('deve renovar token automaticamente se expirado', async () => {
    // Arrange
    setupAuthenticatedUser('default');
    __mockHelpers.expireAccessToken(); // Forçar expiração

    // Act
    await apiClient.get('/api/protected-resource');

    // Assert
    // Deve ter renovado token automaticamente via interceptor
    const newToken = await keycloakService.getAccessToken();
    expect(newToken).not.toBeNull();
  });
});
```

---

## 🔍 Troubleshooting

### Problema 1: Mock não está sendo usado

**Sintoma**: Teste tenta conectar ao Keycloak real

**Solução**:
1. Verificar que `jest.config.js` tem o mapeamento correto:
```javascript
moduleNameMapper: {
  'react-native-app-auth': '<rootDir>/__mocks__/react-native-app-auth.ts',
}
```

2. Garantir que `__mocks__` está na raiz do projeto

3. Limpar cache do Jest:
```bash
npm test -- --clearCache
```

### Problema 2: Estado do mock persiste entre testes

**Sintoma**: Testes falhando quando executados juntos, mas passam isoladamente

**Solução**:
```typescript
afterEach(() => {
  resetMock(); // SEMPRE resetar após cada teste
});
```

### Problema 3: Tokens não estão no formato JWT correto

**Sintoma**: Erro ao decodificar ID token

**Solução**:
Os mocks já geram JWTs válidos. Se precisar customizar:
```typescript
import { __mockHelpers } from './__mocks__/react-native-app-auth';

// Definir tokens manualmente
__mockHelpers.setTokens({
  accessToken: 'custom_token',
  idToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  // ... outros campos
});
```

### Problema 4: Erro "Cannot read property 'accessToken' of null"

**Sintoma**: `getAccessToken()` retorna null inesperadamente

**Solução**:
Verificar se usuário foi autenticado antes:
```typescript
// ❌ ERRADO
it('deve obter token', async () => {
  const token = await keycloakService.getAccessToken();
  expect(token).toBeDefined(); // Vai falhar!
});

// ✅ CORRETO
it('deve obter token', async () => {
  setupAuthenticatedUser('default'); // Setup primeiro!
  const token = await keycloakService.getAccessToken();
  expect(token).toBeDefined();
});
```

### Problema 5: Testes de latência não funcionam

**Sintoma**: Loading não aparece em testes com `setupNetworkLatency()`

**Solução**:
Usar `act()` do React Testing Library:
```typescript
import { act } from '@testing-library/react-native';

it('deve mostrar loading', async () => {
  setupNetworkLatency(1000);

  await act(async () => {
    fireEvent.press(screen.getByTestId('login-button'));
  });

  // Verificar loading
  expect(screen.getByTestId('loading')).toBeTruthy();
});
```

---

## 📊 Checklist de Migração

### Antes de Migrar

- [x] Entender fluxo OAuth2/OIDC do Keycloak
- [x] Identificar todos os pontos de uso do Firebase Auth
- [x] Criar mocks para react-native-app-auth
- [x] Criar helpers de teste

### Durante a Migração

- [ ] Substituir `signInWithEmailAndPassword()` por `authorize()`
- [ ] Substituir `signOut()` por `logout()` + `revoke()`
- [ ] Substituir `getIdToken()` por `getAccessToken()`
- [ ] Atualizar Redux slices de autenticação
- [ ] Atualizar interceptores HTTP
- [ ] Atualizar todos os testes de auth

### Após a Migração

- [ ] Executar todos os testes: `npm test`
- [ ] Verificar cobertura de testes
- [ ] Testar em dispositivos reais (Android + iOS)
- [ ] Validar com servidor Keycloak de staging
- [ ] Documentar mudanças no README

---

## 🚀 Próximos Passos

1. **Migrar Testes de Auth**:
   - [ ] `src/services/__tests__/authService.test.ts`
   - [ ] `src/store/slices/__tests__/authSlice.test.ts`
   - [ ] `src/screens/Auth/__tests__/LoginScreen.test.tsx`

2. **Criar Novos Testes**:
   - [ ] Testes de refresh automático de token
   - [ ] Testes de revogação de token
   - [ ] Testes E2E com Detox

3. **Validação**:
   - [ ] Executar suite completa de testes
   - [ ] Validar cobertura >= 85%
   - [ ] Code review

---

## 📚 Recursos Adicionais

### Documentação Oficial

- [react-native-app-auth](https://github.com/FormidableLabs/react-native-app-auth)
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)
- [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html)

### Arquivos Relacionados

- `src/services/keycloakService.ts` - Implementação real do serviço
- `src/services/authService.ts` - Wrapper de autenticação (deprecated Firebase)
- `jest.config.js` - Configuração de mocks do Jest
- `docs/FIREBASE-CLEANUP-REPORT.md` - Relatório de remoção do Firebase

---

## 👥 Suporte

Para dúvidas ou problemas:

1. Consultar este documento
2. Verificar testes existentes em `src/**/__tests__/`
3. Revisar issues do repositório
4. Contatar o time de desenvolvimento

---

**Última Atualização**: 2025-11-10
**Versão**: 1.0.0
**Autor**: sprint9-keycloak-mocker agent
