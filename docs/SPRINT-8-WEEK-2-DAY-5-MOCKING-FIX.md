# Sprint 8 Week 2 Day 5 - HTTP Client Mocking Fix & Method Discovery

**Date**: 2025-11-06
**Phase**: Service Test Mocking Infrastructure
**Status**: 🟡 Partial Progress - Discovery Phase Complete

---

## 📊 Executive Summary

Fixed critical HTTP client mocking issue affecting ~40 service tests. Discovered that tests were mocking `httpClient` when services use `apiClient`. Also identified method naming mismatches and architectural issues where tests expect methods in wrong services.

### Impact
- **Mocking Issue**: ✅ Fixed (59 references updated across 2 test files)
- **Method Naming**: 🟡 Discovered 2 name mismatches
- **Architecture**: 🟡 Discovered 3 payment methods in wrong service
- **Tests Passing**: ⏳ TBD (blocked by naming/architecture issues)

---

## 🔍 Problem Discovery

### Issue 1: HTTP Client Mocking Mismatch
**Root Cause**: Test files imported and mocked `httpClient`, but services use `apiClient`.

**Evidence**:
```typescript
// userService.ts (line 1)
import { apiClient } from './api';

// userService.test.ts (lines 3-6) - WRONG
import { httpClient } from '../httpClient';
jest.mock('../httpClient');
const mockedHttpClient = httpClient as jest.Mocked<typeof httpClient>;
```

**Result**: All mockedHttpClient calls had "Number of calls: 0" because services never called httpClient.

---

## ✅ Solution Implemented

### 1. Fixed userService.test.ts

**Changes**:
```typescript
// BEFORE:
import { httpClient } from '../httpClient';
jest.mock('../httpClient');
const mockedHttpClient = httpClient as jest.Mocked<typeof httpClient>;

// AFTER:
import { apiClient } from '../api';
jest.mock('../api');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;
```

**References Updated**: 30 instances of `mockedHttpClient` → `mockedApiClient`

**Command Used**:
```bash
sed -i 's/mockedHttpClient/mockedApiClient/g' src/services/__tests__/userService.test.ts
```

### 2. Fixed boxService.test.ts

**Changes**: Same pattern as userService.test.ts

**References Updated**: 29 instances of `mockedHttpClient` → `mockedApiClient`

**Command Used**:
```bash
sed -i 's/mockedHttpClient/mockedApiClient/g' src/services/__tests__/boxService.test.ts
```

### Files Modified
1. `src/services/__tests__/userService.test.ts` (imports + 30 references)
2. `src/services/__tests__/boxService.test.ts` (imports + 29 references)

**Total References Fixed**: 59

---

## 🔍 Additional Issues Discovered

### Issue 2: Method Naming Mismatches

Tests expect methods with different names than actual implementation:

| Test Expects | Actual Method | Service | Status |
|--------------|---------------|---------|--------|
| `uploadAvatar` | `updateAvatar` | userService | ✅ Exists |
| `getStatistics` | `getStats` | userService | ✅ Exists |

**Solution**: Update tests to use correct method names:
- `userService.uploadAvatar()` → `userService.updateAvatar()`
- `userService.getStatistics()` → `userService.getStats()`

### Issue 3: Methods in Wrong Service

Tests expect payment methods in userService, but they're in cartService:

| Method | Test Location | Actual Location | Status |
|--------|---------------|-----------------|--------|
| `getPaymentMethods()` | userService.test.ts | cartService.ts | ✅ Exists |
| `addPaymentMethod()` | userService.test.ts | ? | ❓ Unknown |
| `deletePaymentMethod()` | userService.test.ts | ? | ❓ Unknown |

**Root Cause**: Architectural confusion or tests written before service refactoring.

**Solution Options**:
1. Move payment method tests to cartService.test.ts
2. Implement payment methods in userService (duplicate functionality)
3. Skip payment tests in userService (mark as `.skip()` or `.todo()`)

**Recommendation**: Option 3 (skip for now), investigate architecture in Day 6.

### Issue 4: HTTP Method Mismatches

Some tests mock `.patch()` but services use `.put()`:

**Example**:
```typescript
// userService.ts (line 29)
const _response = await apiClient.put<User>('/user/profile', data);

// userService.test.ts - WRONG
mockedApiClient.patch.mockResolvedValue({ data: mockUpdatedProfile });
expect(mockedApiClient.patch).toHaveBeenCalledWith('/user/profile', updateData);
```

**Services using PUT**:
- `updateProfile()` - line 29
- `updateAddress()` - line 61
- `updatePreferences()` - line 91

**Solution**: Update tests to mock `.put` instead of `.patch` where applicable.

---

## 📊 UserService Method Inventory

**Total Methods**: 32 async methods in 281 lines

<details>
<summary>Complete Method List</summary>

```
async addAddress
async addToFavorites
async cancelAccountDeletion
async cancelOrder
async changePassword
async checkEmailAvailability
async deleteAddress
async deleteNotification
async exportUserData
async getActivityHistory
async getAddresses
async getFavorites
async getNotifications
async getOrderById
async getOrders
async getPreferences
async getProfile
async getStats          ← Tests expect "getStatistics"
async getUnreadNotificationsCount
async isFavorite
async markAllNotificationsAsRead
async markNotificationAsRead
async removeFromFavorites
async requestAccountDeletion
async resendVerificationEmail
async setDefaultAddress
async updateAddress
async updateAvatar      ← Tests expect "uploadAvatar"
async updateNotificationSettings
async updatePreferences
async updateProfile
async verifyEmail
```
</details>

---

## 📈 Impact Analysis

### Before Day 5
- userService tests: ❌ FAIL (mocking httpClient)
- boxService tests: ❌ FAIL (mocking httpClient)
- Tests with "Number of calls: 0": ~40 tests

### After Day 5 (Partial)
- HTTP client mocking: ✅ FIXED (59 references)
- Method naming: 🟡 DISCOVERED (2 mismatches)
- Architecture: 🟡 DISCOVERED (3 methods in wrong service)
- Tests passing: ⏳ BLOCKED (need naming/architecture fixes)

### Projected After Complete Fix
- userService tests: ~20-25 passing (excluding payment methods)
- boxService tests: ~10-12 passing (if no other issues)
- Total impact: +30-37 tests passing

---

## 🎯 Remaining Work (Day 5-6)

### High Priority (2-3 hours)

1. **Fix Method Naming Mismatches**
   - Update userService.test.ts: `uploadAvatar` → `updateAvatar`
   - Update userService.test.ts: `getStatistics` → `getStats`
   - Estimated: 15 minutes

2. **Skip Payment Method Tests**
   - Mark 3 payment tests as `.skip()` in userService.test.ts
   - Add comment explaining they belong in cartService
   - Estimated: 15 minutes

3. **Fix HTTP Method Mismatches**
   - Update tests using `.patch` to use `.put` where applicable
   - Estimated: 30 minutes

4. **Run Tests and Verify**
   - Run userService.test.ts
   - Run boxService.test.ts
   - Verify pass rates
   - Estimated: 15 minutes

5. **Investigate BoxService Test Failures**
   - Similar issues as userService?
   - Missing methods?
   - Estimated: 1-2 hours

### Medium Priority (Day 6)

6. **Payment Architecture Review**
   - Determine if payment methods should be in userService or cartService
   - Move tests to correct location
   - Estimated: 2-3 hours

7. **Full Test Suite Run**
   - Run all tests with fixes applied
   - Calculate new pass rate
   - Update Sprint 8 Week 2 progress metrics
   - Estimated: 30 minutes

---

## 🔧 Technical Decisions

### Decision 1: Fix Mocking vs Refactor Services
**Chosen**: Fix test mocking to match service implementation
**Rationale**:
- Services use apiClient consistently (modern pattern)
- Tests were written incorrectly
- Less risk than changing service implementation
**Alternative**: Refactor services to use httpClient (rejected - higher risk)

### Decision 2: Skip vs Implement Missing Methods
**Chosen**: Skip payment method tests for now
**Rationale**:
- Methods may belong in different service (cartService)
- Implementing duplicates creates technical debt
- Skipping unblocks other test progress
**Alternative**: Implement in userService (rejected - creates duplication)

### Decision 3: Name Tests vs Rename Methods
**Chosen**: Update test method names to match services
**Rationale**:
- Services are production code (higher trust)
- Tests should match implementation
- Less risky than renaming service methods
**Alternative**: Rename service methods (rejected - breaking changes)

---

## 💡 Key Learnings

### Pattern Recognition
1. **Mock the right client**: Always verify which HTTP client services actually use
2. **Test names ≠ method names**: Tests may have been written before implementation
3. **Service boundaries**: Payment methods scattered across userService tests but belong in cartService

### Process Insights
1. **Systematic search**: Used grep to find all method names and compare with tests
2. **Incremental fixes**: Fixed mocking first, discovered other issues during verification
3. **Documentation first**: Wrote discovery summary before attempting fixes

### Testing Anti-patterns Found
1. **Tests written without running**: Payment method tests written for non-existent methods
2. **HTTP method assumptions**: Tests assumed PATCH but implementation uses PUT
3. **Service coupling**: Tests mixed concerns from multiple services

---

## 📝 Recommendations

### Immediate (Day 5-6)
1. ✅ Complete the 3 remaining fixes (naming, skipping, HTTP methods) - 1-2 hours
2. ✅ Run full test suite to verify impact - 30 minutes
3. ✅ Update Sprint 8 Week 2 metrics - 15 minutes

### Short-term (Day 7-10)
1. Review payment architecture - where should these methods live?
2. Move or implement payment methods correctly
3. Review all service test files for similar mocking issues

### Long-term (Sprint 9)
1. Create service test template to prevent mocking issues
2. Add linter rule to catch httpClient vs apiClient mismatches
3. Document service boundaries clearly (what methods belong where)

---

## 🚨 Risks & Mitigations

### Risk 1: More Services Have Same Mocking Issue
**Severity**: MEDIUM
**Likelihood**: HIGH
**Impact**: ~50-100 more tests could be affected

**Mitigation**:
- Search all test files for `httpClient` imports
- Systematic grep: `grep -r "httpClient" src/**/__tests__/`
- Fix all at once in Day 6

### Risk 2: HTTP Method Mismatches Throughout
**Severity**: LOW
**Likelihood**: MEDIUM
**Impact**: Tests mock wrong methods, always show "0 calls"

**Mitigation**:
- Document which services use PUT vs PATCH
- Update test expectations systematically
- Consider: Add service method registry doc

### Risk 3: Architecture Unclear
**Severity**: MEDIUM
**Likelihood**: MEDIUM
**Impact**: Unclear where payment/user methods should live

**Mitigation**:
- Review backend API documentation
- Check if backend has /user/payment-methods endpoints
- Align mobile services with backend structure

---

## 📊 Sprint 8 Week 2 Progress Update

### Cumulative Progress (Days 1-5)

| Milestone | Days 1-4 | Day 5 | Change |
|-----------|----------|-------|--------|
| Infrastructure | 100% | 100% | - |
| Payment Tests | 100% | 100% | - |
| Mocking Infrastructure | 50% | 75% | +25% |
| Tests Passing | 82/193 (42.5%) | TBD | TBD |

### Days Completed
- Day 1: Infrastructure fixes (ESM, Flow, Firebase) ✅
- Day 2: Systematic bugs (52 fixes) + mocking setup ✅
- Day 3: Test analysis (136 failures categorized) ✅
- Day 4: Payment tests (25/25 passing) ✅
- Day 5: HTTP client mocking fix (partial) 🟡

**Overall Progress**: ~35-40% of Week 2 Complete
**Timeline**: Still on track for 2.5-3 week completion

---

## ✅ Success Criteria

### Day 5 Goals
- [x] Identify userService test failure cause
- [x] Identify boxService test failure cause
- [🟡] Fix HTTP client mocking (partial - need verification)
- [⏳] Run tests and verify pass rate increase
- [⏳] Document findings

### Week 2 Goals Progress
- [x] Infrastructure: Tests execute without errors
- [x] Payment Tests: 100% passing
- [🟡] Mocking: HTTP client fixes (need full verification)
- [🟡] Test Success Rate: 42.5% → TBD (target 60%+)
- [⏳] Coverage: ~30-35% (target 60%+)

---

## 📎 Quick Reference

### Commands Used
```bash
# Fix userService mocking
sed -i 's/mockedHttpClient/mockedApiClient/g' src/services/__tests__/userService.test.ts

# Fix boxService mocking
sed -i 's/mockedHttpClient/mockedApiClient/g' src/services/__tests__/boxService.test.ts

# List all userService methods
grep "^\s*async\s" src/services/userService.ts | sed 's/^[[:space:]]*//' | sed 's/(.*//' | sort

# Check for httpClient usage in all tests
grep -r "httpClient" src/**/__tests__/ --include="*.ts"
```

### Files Modified (Day 5)
1. `src/services/__tests__/userService.test.ts` - HTTP client mocking fix
2. `src/services/__tests__/boxService.test.ts` - HTTP client mocking fix

### Files To Modify (Next)
1. `src/services/__tests__/userService.test.ts` - Method name fixes
2. `src/services/__tests__/userService.test.ts` - Skip payment tests
3. `src/services/__tests__/userService.test.ts` - HTTP method fixes

---

**Status**: Day 5 Partial Complete - Discovery Phase ✅ | Fixes Pending 🟡
**Next Session**: Complete Day 5 remaining fixes (1-2 hours)
**Sprint 8 Week 2 Progress**: ~35-40% Complete
**On Track**: Yes (may need extra 2-3 days for discovered issues)

---

*Document generated: 2025-11-06 06:00 BRT*
*Maintainer: Claude Code (crowbar-mobile project)*
