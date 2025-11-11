# Auth Test Migration Pattern: Firebase → Keycloak OAuth2

> **Sprint 9 Week 1** | **Status**: In Progress
> **Migration Progress**: 10/70 tests migrated (14%)
> **Target**: 60-70 tests by end of Sprint 9

## 📋 Overview

This document outlines the migration pattern for converting authentication tests from Firebase Auth to Keycloak OAuth2/OIDC using `react-native-app-auth`.

## 🎯 Migration Goals

### Sprint 9 Week 1 (Current)
- ✅ **Create base test infrastructure** with Keycloak mocks
- ✅ **Migrate 10 critical auth tests** (Login, Logout, Token management)
- ✅ **Document migration pattern** for team reference
- ⏳ **Ensure all migrated tests pass**

### Sprint 9 Week 2-3
- Migrate 20-30 additional tests (Social auth, MFA, Token edge cases)
- Update integration tests to use Keycloak
- Add E2E tests with real Keycloak instance

### Sprint 9 Week 4
- Complete remaining 30 tests
- Full regression suite passing
- Performance benchmarking

## 🔄 Migration Pattern

### Old Pattern (Firebase Auth)

```typescript
// ❌ OLD - Firebase Auth
import auth from '@react-native-firebase/auth';

describe('Login Test', () => {
  it('should login with email/password', async () => {
    // Arrange
    const mockAuth = auth();
    mockAuth.signInWithEmailAndPassword.mockResolvedValue({
      user: {
        uid: 'firebase-uid',
        email: 'test@crowbar.com',
        getIdToken: jest.fn().mockResolvedValue('firebase-token'),
      },
    });

    // Act
    const result = await authService.login({
      email: 'test@crowbar.com',
      password: 'password123',
    });

    // Assert
    expect(result.user.uid).toBe('firebase-uid');
    expect(result.token).toBe('firebase-token');
  });
});
```

### New Pattern (Keycloak OAuth2)

```typescript
// ✅ NEW - Keycloak OAuth2
import keycloakService from '../keycloakService';
import { authorize } from 'react-native-app-auth';

jest.mock('../keycloakService');
jest.mock('react-native-app-auth');

describe('Login Test', () => {
  it('should login with OAuth2 flow', async () => {
    // Arrange
    const mockOAuthResult = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      idToken: 'mock-id-token',
      accessTokenExpirationDate: new Date(Date.now() + 3600000).toISOString(),
      tokenType: 'Bearer',
      scopes: ['openid', 'profile', 'email'],
    };

    mockedKeycloakService.login.mockResolvedValue(mockOAuthResult);

    // Act
    const result = await authService.loginOAuth();

    // Assert
    expect(result.accessToken).toBe('mock-access-token');
    expect(result.refreshToken).toBe('mock-refresh-token');
    expect(result.idToken).toBe('mock-id-token');
  });
});
```

## 🧩 Key Differences

### Authentication Flow

| Aspect | Firebase Auth | Keycloak OAuth2 |
|--------|--------------|-----------------|
| **Login Method** | `signInWithEmailAndPassword()` | `authorize()` (OAuth2 flow) |
| **Token Type** | Custom Firebase token | JWT (Access + ID + Refresh) |
| **Token Storage** | Automatic (Firebase SDK) | Manual (Keychain/AsyncStorage) |
| **User Object** | `FirebaseUser` | Parsed from ID token claims |
| **Session Management** | Firebase SDK handles | Manual refresh logic |
| **Logout** | `signOut()` | `revoke()` + clear storage |

### Token Management

```typescript
// ❌ OLD - Firebase (automatic)
const user = firebase.auth().currentUser;
const token = await user.getIdToken();

// ✅ NEW - Keycloak (manual with refresh)
const token = await keycloakService.getAccessToken(); // Auto-refreshes if expired
```

### User Info Retrieval

```typescript
// ❌ OLD - Firebase
const user = firebase.auth().currentUser;
console.log(user.email, user.displayName, user.photoURL);

// ✅ NEW - Keycloak (decode ID token)
const userInfo = await keycloakService.getUserInfo();
console.log(userInfo.email, userInfo.name, userInfo.picture);
```

## 📝 Test Categories & Migration Status

### ✅ Completed (10 tests)

1. **OAuth2 Login Flow** - Login with OAuth2 authorization
2. **Login Failures** - Handle authorization errors and network failures
3. **Token Storage** - Store tokens in Keychain after login
4. **Logout Flow** - Revoke tokens and clear storage
5. **Token Refresh** - Automatically refresh expired tokens
6. **Network Errors** - Handle timeouts and connection errors
7. **Token Validation** - Validate JWT format (3-part structure)
8. **User Profile Parsing** - Decode user info from ID token
9. **Concurrent Logins** - Handle multiple simultaneous login attempts
10. **Session State** - Maintain authentication state

### ⏳ In Progress (0 tests)

None - ready to start next batch!

### 📋 TODO - Priority 1 (20 tests)

#### Social Auth Providers (10 tests)
- Google OAuth2 login
- Facebook OAuth2 login
- Apple OAuth2 login
- Social auth cancellation handling
- Social profile synchronization with Keycloak
- Social account linking
- Social account unlinking
- Multiple social providers per account
- Social profile updates
- Social token refresh

#### Token Expiration Edge Cases (10 tests)
- Token expiration detection
- Automatic token refresh before expiration
- Invalid token cleanup
- Refresh token expiration handling
- Force re-login when refresh fails
- Token refresh race conditions
- Expired token retry logic
- Token expiration notifications
- Background token refresh
- Token lifecycle logging

### 📋 TODO - Priority 2 (20 tests)

#### MFA/2FA Flows (10 tests)
- OTP code request when MFA enabled
- OTP code validation (correct)
- OTP code validation (incorrect)
- SMS recovery flow
- Email recovery flow
- Backup codes generation
- Backup codes usage
- MFA setup flow
- MFA disable flow
- MFA enforcement policies

#### Offline Token Handling (10 tests)
- Store tokens offline
- Recover tokens after app restart
- Clear offline tokens on logout
- Sync offline tokens when online
- Offline token expiration
- Offline refresh token usage
- Offline session restoration
- Offline authentication check
- Offline user info cache
- Offline token security

### 📋 TODO - Priority 3 (20 tests)

#### Backend Token Synchronization (10 tests)
- Sync Keycloak token with backend
- Validate token on backend
- Exchange Keycloak token for backend JWT
- Maintain backend session sync
- Backend token refresh
- Backend logout sync
- Backend session timeout
- Backend token validation errors
- Backend multi-tenancy support
- Backend RBAC token claims

#### Multiple Device Sessions (10 tests)
- Login on multiple devices
- Invalidate old session on new login
- List active devices
- Remote logout from device
- Device fingerprinting
- Session concurrency limits
- Device trust levels
- Session activity tracking
- Cross-device notifications
- Session security alerts

## 🛠️ Mock Setup Guide

### Keycloak Service Mock

```typescript
// Mock keycloakService
jest.mock('../keycloakService');
const mockedKeycloakService = keycloakService as jest.Mocked<typeof keycloakService>;

// Setup mock responses
mockedKeycloakService.login.mockResolvedValue({
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  idToken: 'mock-id-token',
  accessTokenExpirationDate: new Date(Date.now() + 3600000).toISOString(),
  tokenType: 'Bearer',
  scopes: ['openid', 'profile', 'email'],
});

mockedKeycloakService.getAccessToken.mockResolvedValue('mock-access-token');
mockedKeycloakService.getUserInfo.mockResolvedValue({
  sub: 'user-123',
  email: 'test@crowbar.com',
  name: 'Test User',
  preferred_username: 'testuser',
  email_verified: true,
});
```

### React Native App Auth Mock

```typescript
// Mock react-native-app-auth
jest.mock('react-native-app-auth');
const mockedAuthorize = authorize as jest.MockedFunction<typeof authorize>;
const mockedRefresh = refresh as jest.MockedFunction<typeof refresh>;
const mockedRevoke = revoke as jest.MockedFunction<typeof revoke>;

// Setup OAuth2 authorization
mockedAuthorize.mockResolvedValue({
  accessToken: 'oauth-access-token',
  refreshToken: 'oauth-refresh-token',
  idToken: 'oauth-id-token',
  accessTokenExpirationDate: new Date(Date.now() + 3600000).toISOString(),
  tokenType: 'Bearer',
  scopes: ['openid', 'profile', 'email'],
});
```

### Keychain Mock

```typescript
// Mock react-native-keychain
jest.mock('react-native-keychain');
const mockedKeychain = Keychain as jest.Mocked<typeof Keychain>;

// Setup token storage/retrieval
mockedKeychain.setGenericPassword.mockResolvedValue({ service: 'keycloak_tokens' } as any);
mockedKeychain.getGenericPassword.mockResolvedValue({
  username: 'keycloak',
  password: JSON.stringify({
    accessToken: 'stored-access-token',
    refreshToken: 'stored-refresh-token',
    idToken: 'stored-id-token',
    accessTokenExpirationDate: new Date(Date.now() + 3600000).toISOString(),
  }),
  service: 'keycloak_tokens',
});
mockedKeychain.resetGenericPassword.mockResolvedValue(true);
```

## 📊 Test Coverage Goals

### Current Coverage
- **authService.ts**: 0% → **Target: 85%**
- **keycloakService.ts**: 0% → **Target: 90%**

### Sprint 9 Milestones
- **Week 1**: 10 tests (14% coverage) ✅
- **Week 2**: 30 tests (43% coverage) ⏳
- **Week 3**: 50 tests (71% coverage) ⏳
- **Week 4**: 70 tests (100% coverage) ⏳

## 🚀 Running Tests

```bash
# Run all auth tests
npm test -- authService.test.ts

# Run specific test suite
npm test -- authService.test.ts -t "Login OAuth2"

# Run with coverage
npm test -- authService.test.ts --coverage

# Watch mode for development
npm test -- authService.test.ts --watch
```

## 🔍 Common Migration Pitfalls

### 1. Async/Await Issues
```typescript
// ❌ BAD - Missing await
const result = authService.loginOAuth(); // Returns Promise
expect(result.accessToken).toBe('token'); // FAILS

// ✅ GOOD - Proper await
const result = await authService.loginOAuth();
expect(result.accessToken).toBe('token'); // PASSES
```

### 2. Mock Not Configured
```typescript
// ❌ BAD - Mock not setup
it('should login', async () => {
  const result = await authService.loginOAuth(); // Undefined behavior
});

// ✅ GOOD - Mock properly configured
it('should login', async () => {
  mockedKeycloakService.login.mockResolvedValue({...});
  const result = await authService.loginOAuth(); // Predictable
});
```

### 3. Token Format Mismatch
```typescript
// ❌ BAD - Wrong token format
mockedKeycloakService.getAccessToken.mockResolvedValue({
  token: 'access-token' // Object instead of string
});

// ✅ GOOD - Correct token format
mockedKeycloakService.getAccessToken.mockResolvedValue('access-token');
```

### 4. Date Handling
```typescript
// ❌ BAD - Invalid date format
accessTokenExpirationDate: '2025-01-08' // Missing time

// ✅ GOOD - ISO 8601 format
accessTokenExpirationDate: new Date(Date.now() + 3600000).toISOString()
```

## 📚 Reference Documentation

### Keycloak OAuth2/OIDC
- [Keycloak Authorization Flows](https://www.keycloak.org/docs/latest/securing_apps/#authorization-code-flow)
- [OIDC Token Claims](https://openid.net/specs/openid-connect-core-1_0.html#Claims)
- [JWT Token Structure](https://jwt.io/introduction)

### React Native App Auth
- [GitHub Repository](https://github.com/FormidableLabs/react-native-app-auth)
- [API Documentation](https://github.com/FormidableLabs/react-native-app-auth/blob/master/docs/API.md)
- [Configuration Guide](https://github.com/FormidableLabs/react-native-app-auth#keycloak)

### Testing Best Practices
- [Jest Mocking Guide](https://jestjs.io/docs/mock-functions)
- [Testing Async Code](https://jestjs.io/docs/asynchronous)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)

## 🤝 Team Guidelines

### Before Migrating a Test
1. Read this migration pattern document
2. Check if similar test already migrated
3. Use existing mocks from migrated tests
4. Follow the 3-part structure (Arrange, Act, Assert)

### After Migrating a Test
1. Run the test locally (`npm test`)
2. Ensure test passes consistently
3. Update progress counters in this document
4. Mark test as ✅ completed in test file
5. Commit with message: `test: migrate [test-name] to Keycloak OAuth2`

### Code Review Checklist
- [ ] Test follows migration pattern
- [ ] Mocks properly configured
- [ ] Test passes locally
- [ ] Test name descriptive
- [ ] Comments explain OAuth2 flow
- [ ] No Firebase remnants
- [ ] Coverage increased

## 📞 Support

### Questions?
- **Slack**: #crowbar-dev
- **Tech Lead**: @sprint9-auth-migrator
- **Documentation**: `/docs/KEYCLOAK-MIGRATION.md`

### Blocked?
- Check existing tests for examples
- Review Keycloak service implementation
- Test with real Keycloak instance (dev environment)
- Ask in team standup

---

**Last Updated**: 2025-01-08
**Maintained By**: Sprint 9 Auth Migration Team
**Next Review**: End of Sprint 9 Week 1
