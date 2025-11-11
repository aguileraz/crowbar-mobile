# Auth Migration Quick Reference Card

> **Sprint 9** | **Quick Copy-Paste Guide**

## 🚀 Quick Start

```bash
# Run auth tests
npm test -- authService.test.ts

# Watch mode
npm test -- authService.test.ts --watch

# With coverage
npm test -- authService.test.ts --coverage
```

## 📋 Test Template

```typescript
describe('✅ TEST X: [Category] - [Description]', () => {
  it('[Portuguese description]', async () => {
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
    expect(mockedKeycloakService.login).toHaveBeenCalled();
  });
});
```

## 🧪 Common Mocks

### Successful Login
```typescript
mockedKeycloakService.login.mockResolvedValue({
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  idToken: 'mock-id-token',
  accessTokenExpirationDate: new Date(Date.now() + 3600000).toISOString(),
  tokenType: 'Bearer',
  scopes: ['openid', 'profile', 'email'],
});
```

### Failed Login
```typescript
mockedKeycloakService.login.mockRejectedValue(
  new Error('User cancelled authorization')
);
```

### Get Access Token
```typescript
mockedKeycloakService.getAccessToken.mockResolvedValue('valid-token');
```

### Get User Info
```typescript
mockedKeycloakService.getUserInfo.mockResolvedValue({
  sub: 'user-123',
  email: 'test@crowbar.com',
  name: 'Test User',
  preferred_username: 'testuser',
  email_verified: true,
});
```

### Logout
```typescript
mockedKeycloakService.logout.mockResolvedValue();
```

## 🔄 Migration Checklist

Before migrating:
- [ ] Read migration pattern doc
- [ ] Find similar existing test
- [ ] Copy mock setup

After migrating:
- [ ] Test passes locally
- [ ] Update progress counter
- [ ] Mark as ✅ in test file
- [ ] Commit with proper message

## 📊 Progress (Week 1)

- ✅ **10/70 tests** migrated (14%)
- ✅ **25/25 tests** passing (100%)
- ⏳ **60 tests** remaining

## 🎯 Next Priority (Week 2)

1. Social Auth (10 tests)
2. Token Expiration (10 tests)

## 📚 Full Docs

- **Pattern Guide**: `/docs/AUTH-TEST-MIGRATION-PATTERN.md`
- **Summary**: `/docs/SPRINT-9-WEEK-1-AUTH-MIGRATION-SUMMARY.md`
- **Test File**: `/src/services/__tests__/authService.test.ts`

---

**Last Updated**: 2025-01-08
