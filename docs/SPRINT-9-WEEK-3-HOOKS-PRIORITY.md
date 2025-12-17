# Sprint 9 Week 3 - Priorização de Hooks para Testes

> **Data**: 2025-01-12
> **Status**: Em Progresso
> **Target**: 5-8 hooks críticos testados
> **Meta Coverage**: 50%

---

## 🎯 Hooks Priorizados (7 hooks)

### 1. ⭐⭐⭐⭐⭐ useAuthListener (HIGHEST PRIORITY)
**Arquivo**: `src/hooks/useAuthListener.ts`
**Complexidade**: ⭐ Simple (48 linhas)
**Testes Existentes**: ❌ NENHUM
**Tempo Estimado**: 1-2 horas

**Por que é crítico**:
- Autenticação é fundação de todo o app
- Usado em AppNavigator (main entry point)
- ⚠️ Usa Firebase Auth deprecated (migração Keycloak pendente)

**Funcionalidades Principais**:
- Listen Firebase Auth state changes
- Sync user state com Redux
- Handle login/logout events
- Manage app initialization

**Dependências**:
- Redux (authSlice)
- Firebase Auth
- Logger service

**Casos de Teste Necessários**:
- [ ] User login state change
- [ ] User logout state change
- [ ] App initialization flow
- [ ] Redux state synchronization
- [ ] Cleanup on unmount

---

### 2. ⭐⭐⭐⭐⭐ useNotifications (HIGHEST PRIORITY)
**Arquivo**: `src/hooks/useNotifications.ts`
**Complexidade**: ⭐⭐⭐ Complex (360 linhas, 5 sub-hooks)
**Testes Existentes**: ❌ NENHUM
**Tempo Estimado**: 4-6 horas

**Por que é crítico**:
- Push notifications = engajamento e order updates
- Usado em NotificationsScreen, NotificationSettingsScreen
- Integração FCM crítica

**Funcionalidades Principais**:
- FCM token management
- Notification initialization e permissions
- Real-time listeners (foreground/background)
- Notification CRUD (mark read, delete, fetch)
- Settings management
- Badge count updates

**Sub-hooks**:
- `useNotificationBadge`
- `useNotificationSettings`
- `useNotificationPermissions`
- `useNotificationFilters`

**Dependências**:
- Redux (notificationsSlice)
- Firebase Cloud Messaging
- Notification service
- Platform APIs

**Casos de Teste Necessários**:
- [ ] Permission request flow
- [ ] FCM token registration
- [ ] Message handling (foreground/background)
- [ ] Notification CRUD operations
- [ ] Real-time listeners setup/cleanup
- [ ] Settings updates
- [ ] Badge count calculations

---

### 3. ⭐⭐⭐⭐ useRealtime (HIGH PRIORITY)
**Arquivo**: `src/hooks/useRealtime.ts`
**Complexidade**: ⭐⭐⭐ Complex (231 linhas, 4 sub-hooks)
**Testes Existentes**: ❌ NENHUM
**Tempo Estimado**: 3-4 horas

**Por que é crítico**:
- Real-time stock updates previnem overselling
- Order tracking melhora UX
- Usado em HomeScreen para live events

**Funcionalidades Principais**:
- WebSocket connection management
- Real-time box stock updates
- Order status tracking
- Live events feed
- Auto-reconnect on app state changes

**Sub-hooks**:
- `useBoxRealtime`
- `useOrderRealtime`
- `useLiveEvents`

**Dependências**:
- Redux (realtimeSlice)
- Socket.IO/WebSocket service
- AppState

**Casos de Teste Necessários**:
- [ ] Connection/disconnection flow
- [ ] Subscription management
- [ ] Real-time data updates
- [ ] Auto-reconnect logic
- [ ] Error handling for disconnections
- [ ] AppState integration

---

### 4. ⭐⭐⭐⭐ useLiveNotifications (HIGH PRIORITY)
**Arquivo**: `src/hooks/useLiveNotifications.ts`
**Complexidade**: ⭐⭐⭐ Complex (346 linhas, 4 sub-hooks)
**Testes Existentes**: ❌ NENHUM
**Tempo Estimado**: 3-4 horas

**Por que é crítico**:
- Converte real-time events em notificações
- Critical para engagement
- Usado em HomeScreen junto com useRealtime

**Funcionalidades Principais**:
- Converte live events em notifications
- Toast queue management
- Type-based filtering (orders, promotions, social)
- Sound e badge updates
- Navigation handling for taps

**Sub-hooks**:
- `useOrderNotifications`
- `usePromotionNotifications`
- `useSocialNotifications`

**Dependências**:
- Redux (realtimeSlice, notificationsSlice)
- useNotifications hook
- Navigation service

**Casos de Teste Necessários**:
- [ ] Event to notification conversion
- [ ] Toast queue management
- [ ] Type filtering logic
- [ ] Settings-based filtering
- [ ] Notification tap handling
- [ ] Sound/badge updates

---

### 5. ⭐⭐⭐⭐ useAnalytics (HIGH PRIORITY)
**Arquivo**: `src/hooks/useAnalytics.ts`
**Complexidade**: ⭐⭐⭐ Complex (364 linhas, 4 sub-hooks)
**Testes Existentes**: ❌ NENHUM
**Tempo Estimado**: 3-4 horas

**Por que é crítico**:
- Analytics = product decisions e conversion tracking
- Usado em HomeScreen, NotificationsScreen
- Business intelligence foundation

**Funcionalidades Principais**:
- Firebase Analytics initialization
- Custom event tracking
- Screen view tracking
- User properties e ID management
- Conversion tracking
- Error tracking
- E-commerce events (purchase, add to cart, box opening)

**Sub-hooks**:
- `useScreenTracking`
- `usePerformanceTracking`
- `useEcommerceTracking`
- `useEngagementTracking`

**Dependências**:
- Redux (analyticsSlice)
- Firebase Analytics
- Analytics service

**Casos de Teste Necessários**:
- [ ] Event tracking with parameters
- [ ] Screen view tracking
- [ ] User properties updates
- [ ] Conversion events
- [ ] E-commerce tracking
- [ ] Error tracking
- [ ] Settings-based enable/disable

---

### 6. ⭐⭐⭐ usePerformance (MEDIUM PRIORITY)
**Arquivo**: `src/hooks/usePerformance.ts`
**Complexidade**: ⭐⭐⭐ Complex (432 linhas, 5 sub-hooks)
**Testes Existentes**: ❌ NENHUM
**Tempo Estimado**: 2-3 horas

**Por que é importante**:
- Performance monitoring previne churn
- Usado em HomeScreen, PerformanceDashboard
- Production debugging

**Funcionalidades Principais**:
- Component render time tracking
- Interaction time measurement
- Memory usage estimation
- List scroll performance
- Navigation performance
- API call performance
- App-wide metrics (crashes, uptime)

**Sub-hooks**:
- `useListPerformance`
- `useNavigationPerformance`
- `useApiPerformance`
- `useAppPerformance`

**Dependências**:
- InteractionManager
- AppState
- Bundle analyzer utility
- ErrorUtils

**Casos de Teste Necessários**:
- [ ] Render time measurement
- [ ] Interaction tracking
- [ ] List scroll performance
- [ ] Navigation timing
- [ ] API call tracking
- [ ] Error counting

---

### 7. ⭐⭐⭐ useMonitoring (MEDIUM PRIORITY)
**Arquivo**: `src/hooks/useMonitoring.ts`
**Complexidade**: ⭐⭐ Medium (305 linhas, 6 sub-hooks)
**Testes Existentes**: ❌ NENHUM
**Tempo Estimado**: 2-3 horas

**Por que é importante**:
- Production monitoring para issue detection
- Usado em MonitoringDashboard
- Debugging e troubleshooting

**Funcionalidades Principais**:
- Firebase Crashlytics integration
- Firebase Performance monitoring
- Screen tracking
- API call tracking
- User action tracking
- Error boundary integration

**Sub-hooks**:
- `useScreenTracking`
- `usePerformanceTracking`
- `useApiTracking`
- `useUserActionTracking`
- `useErrorBoundary`

**Dependências**:
- Firebase Crashlytics
- Firebase Performance
- Logger service

**Casos de Teste Necessários**:
- [ ] Error logging
- [ ] Performance trace creation
- [ ] Screen tracking
- [ ] API monitoring
- [ ] Custom attributes
- [ ] Error boundary integration

---

## 📊 Resumo de Esforço

| Hook | Prioridade | Complexidade | Tempo | Sub-hooks |
|------|-----------|--------------|-------|-----------|
| useAuthListener | ⭐⭐⭐⭐⭐ | ⭐ | 1-2h | 0 |
| useNotifications | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 4-6h | 4 |
| useRealtime | ⭐⭐⭐⭐ | ⭐⭐⭐ | 3-4h | 3 |
| useLiveNotifications | ⭐⭐⭐⭐ | ⭐⭐⭐ | 3-4h | 3 |
| useAnalytics | ⭐⭐⭐⭐ | ⭐⭐⭐ | 3-4h | 4 |
| usePerformance | ⭐⭐⭐ | ⭐⭐⭐ | 2-3h | 5 |
| useMonitoring | ⭐⭐⭐ | ⭐⭐ | 2-3h | 6 |
| **TOTAL** | - | - | **18-26h** | **25** |

---

## ✅ Hooks Já Testados (Excluídos da Week 3)

### useOffline ✅
**Arquivo**: `src/hooks/useOffline.ts`
**Testes**: `src/hooks/__tests__/useOffline.test.ts` (381 linhas)
**Status**: ✅ COMPREHENSIVE TEST COVERAGE

**Sub-hooks testados**:
- `useOfflineCache`
- `useOfflineImage`
- `useOfflineAction`
- `useOfflineDiffSync`
- `useOfflineCart`
- `useOfflineProfile`

**Nota**: Excelente referência para padrões de teste de hooks complexos

---

## 🚫 Hooks Não Priorizados (Lower Priority)

### Animation Hooks (Visual Polish - Não Crítico)
- `useAnimations` (367 linhas)
- `useReanimatedAnimations` (320 linhas)
- `useGestureAnimations` (373 linhas)
- `useAnimationHelpers` (329 linhas)

**Rationale**: Nice-to-have, não afetam funcionalidades críticas de negócio

### Performance Optimization (Utility Layer)
- `usePerformanceOptimization` (432 linhas)
- `useOptimizedCallback` (217 linhas)

**Rationale**: Optimization layer, não business-critical

### Other Hooks
- `useCountdown` (231 linhas) - Timer functionality, lower priority

---

## 🎯 Ordem de Implementação Recomendada

### Week 3 Day 1-2: Foundation (6-8 horas)
1. **useAuthListener** (1-2h) - Simples, crítico, foundation
2. **useNotifications** (4-6h) - Complexo mas modular

### Week 3 Day 3-4: Real-time (6-8 horas)
3. **useRealtime** (3-4h) - WebSocket integration
4. **useLiveNotifications** (3-4h) - Depende de useRealtime

### Week 3 Day 5: Analytics & Monitoring (5-7 horas)
5. **useAnalytics** (3-4h) - Business intelligence
6. **usePerformance** (2-3h) - Performance tracking

### Week 3 Day 6 (Opcional): Extended Coverage
7. **useMonitoring** (2-3h) - Production monitoring

---

## 🛠️ Padrões de Teste Necessários

### Mocking Comum
- **Redux Store**: `configureStore` with test state
- **Firebase Services**: Mock Firebase Auth, FCM, Analytics, Crashlytics
- **WebSocket**: Mock Socket.IO client
- **Platform APIs**: AppState, InteractionManager, Platform

### React Hooks Testing
```typescript
import { renderHook, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Wrapper com Redux Provider
const wrapper = ({ children }) => (
  <Provider store={store}>{children}</Provider>
);

// Render hook
const { result, rerender, unmount } = renderHook(
  () => useHookName(),
  { wrapper }
);
```

### Async Operations
```typescript
await act(async () => {
  await result.current.someAsyncFunction();
});
```

### Cleanup Testing
```typescript
unmount();
expect(cleanupFunction).toHaveBeenCalled();
```

---

## 📚 Referências

### Template Existente
- **useOffline.test.ts**: 381 linhas, padrão de excelência para hooks complexos

### Testing Library Docs
- React Native Testing Library: https://callstack.github.io/react-native-testing-library/
- React Hooks Testing: https://react-hooks-testing-library.com/

### Jest Mocking
- Mock Functions: https://jestjs.io/docs/mock-functions
- Manual Mocks: https://jestjs.io/docs/manual-mocks

---

## 📈 Impacto Esperado na Coverage

### Baseline (Week 2)
- **Coverage Estimada**: ~38-40%
- **Módulos Testados**: 7/120 (~6%)

### Target (Week 3)
- **Coverage Meta**: 50%
- **Módulos Adicionais**: +7 hooks críticos
- **Statements Adicionais**: ~2500-3000 (estimativa)

### Cálculo
- Hooks priorizados: ~2400 linhas de código
- Com testes: ~2000 linhas adicionais
- Total novo código coberto: ~4400 linhas
- **Coverage esperada**: 38% + 12% = **50%** ✅

---

**Versão**: 1.0.0
**Data**: 2025-01-12
**Status**: 🔄 EM PROGRESSO
**Próximo**: Implementar testes de useAuthListener

*Sprint 9 Week 3: Aumentando coverage para 50%* 🎯📊🚀
