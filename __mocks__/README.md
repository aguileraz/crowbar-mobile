# Keycloak OAuth2/OIDC Mocks

> **Sprint 9 - Semana 1**: Mocks completos para testes de autenticação Keycloak

## 📁 Estrutura de Arquivos

```
__mocks__/
├── react-native-app-auth.ts       # Mock principal (502 linhas)
├── keycloakTestHelpers.ts         # Helpers de teste (360 linhas)
├── __tests__/
│   └── keycloak-mock-examples.test.ts  # Exemplos completos
└── README.md                       # Este arquivo
```

## 🚀 Quick Start

```typescript
import {
  setupSuccessfulLogin,
  resetMock,
  expectValidAuthResult,
} from '__mocks__/keycloakTestHelpers';

describe('Auth Tests', () => {
  beforeEach(() => resetMock());

  it('deve fazer login', async () => {
    setupSuccessfulLogin('default');
    const result = await authorize(config);
    expectValidAuthResult(result);
  });
});
```

## 📖 Documentação

- **Guia Completo**: `../docs/KEYCLOAK-MOCKS-GUIDE.md` (855 linhas)
- **Quick Reference**: `../docs/KEYCLOAK-QUICK-REFERENCE.md`
- **Exemplos de Uso**: `src/test/mocks/keycloak-mock-examples.test.ts`

## 🎯 Recursos Principais

### Mock Principal (`react-native-app-auth.ts`)
- ✅ Mock de `authorize()` - OAuth2 Authorization Code Flow
- ✅ Mock de `refresh()` - Token refresh
- ✅ Mock de `revoke()` - Token revocation
- ✅ Mock de `logout()` - OIDC logout
- ✅ Geração de JWTs realistas
- ✅ 3 perfis de usuário (default, admin, unverified)
- ✅ Simulação de erros (network, timeout, 500, invalid credentials)
- ✅ Simulação de latência de rede
- ✅ Controle de expiração de tokens

### Test Helpers (`keycloakTestHelpers.ts`)
- ✅ 9 funções de setup de cenários
- ✅ 4 funções de verificação de estado
- ✅ 3 assertions customizadas
- ✅ Dados de teste reutilizáveis
- ✅ Decodificação de JWT

## 🔧 Configuração

O mock já está configurado automaticamente via `jest.config.js`:

```javascript
moduleNameMapper: {
  'react-native-app-auth': '<rootDir>/__mocks__/react-native-app-auth.ts',
}
```

## 📊 Estatísticas

- **Total de Linhas**: 1,717
- **Arquivos Criados**: 5
- **Cenários de Teste**: 12+
- **Funções Helper**: 20+
- **Perfis de Usuário**: 3
- **Tipos de Erro**: 4

## 🎭 Cenários Suportados

1. ✅ Login bem-sucedido (3 perfis)
2. ✅ Erro de rede
3. ✅ Credenciais inválidas
4. ✅ Timeout de requisição
5. ✅ Erro 500 do servidor
6. ✅ Token refresh
7. ✅ Token expirado
8. ✅ Logout
9. ✅ Revogação de token
10. ✅ Simulação de latência
11. ✅ Validação de JWT
12. ✅ Gerenciamento de estado

## 🚦 Como Usar

### 1. Login Bem-Sucedido
```typescript
setupSuccessfulLogin('default');
const result = await authorize(config);
```

### 2. Erro de Rede
```typescript
setupNetworkError();
await expect(authorize(config)).rejects.toThrow('Network');
```

### 3. Token Refresh
```typescript
setupAuthenticatedUser('admin');
const result = await refresh(config, { refreshToken });
```

### 4. Verificar Estado
```typescript
expect(isMockAuthenticated()).toBe(true);
const tokens = getMockTokens();
```

## 🧪 Executar Testes de Exemplo

```bash
npm test -- src/test/mocks/keycloak-mock-examples.test.ts
```

## 📚 Próximos Passos

1. Migrar testes existentes de Firebase para Keycloak
2. Criar testes para componentes de Auth (LoginScreen, etc.)
3. Criar testes para Redux authSlice
4. Criar testes de integração com API

## 🆘 Suporte

- **Documentação Completa**: `docs/KEYCLOAK-MOCKS-GUIDE.md`
- **Quick Reference**: `docs/KEYCLOAK-QUICK-REFERENCE.md`
- **Exemplos**: `src/test/mocks/keycloak-mock-examples.test.ts`

---

**Criado por**: sprint9-keycloak-mocker agent
**Data**: 2025-11-10
**Sprint**: 9 - Semana 1
**Status**: ✅ Completo e pronto para uso
