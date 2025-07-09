# Guia de Performance - Crowbar Mobile

Este documento descreve as otimizações de performance implementadas e melhores práticas para manter a aplicação Crowbar Mobile rápida e eficiente.

## 📊 Métricas de Performance

### Métricas Alvo
- **Tempo de inicialização**: < 2 segundos
- **Tamanho do bundle**: < 5MB (JavaScript)
- **Uso de memória**: < 150MB em uso normal
- **FPS em listas**: 60 FPS constante
- **Tempo de resposta de navegação**: < 100ms

### Como Medir
```bash
# Analisar bundle size
npm run analyze:bundle

# Executar testes de performance
npm run test:performance

# Monitorar em desenvolvimento
npx react-devtools
```

## 🚀 Otimizações Implementadas

### 1. Code Splitting e Lazy Loading

**Implementação:**
```typescript
// src/utils/lazyWithPreload.ts
import { lazyWithPreload } from '../utils/lazyWithPreload';

// Lazy load de telas secundárias
const BoxDetailsScreen = lazyWithPreload(() => import('../screens/Box/BoxDetailsScreen'));
```

**Benefícios:**
- Reduz o bundle inicial em ~40%
- Melhora o tempo de inicialização
- Carrega telas sob demanda

**Uso:**
```tsx
// Pré-carregar telas críticas
usePreloadComponents([
  BoxDetailsScreen,
  SearchScreen,
  CartScreen,
]);
```

### 2. Otimização de Imagens

**FastImage implementado:**
```tsx
// src/components/common/OptimizedImage.tsx
import OptimizedImage from '../components/common/OptimizedImage';

<OptimizedImage
  source={{ uri: imageUrl }}
  style={styles.image}
  priority={FastImage.priority.high}
  resizeMode={FastImage.resizeMode.cover}
/>
```

**Benefícios:**
- Cache automático de imagens
- Carregamento progressivo
- Placeholders durante carregamento
- Suporte a WebP

**Melhores práticas:**
- Use imagens WebP quando possível
- Forneça múltiplas resoluções (@1x, @2x, @3x)
- Implemente lazy loading para imagens fora da viewport
- Use cache agressivo para imagens estáticas

### 3. Listas Otimizadas com FlashList

**Implementação:**
```tsx
// src/components/common/OptimizedList.tsx
import { OptimizedList } from '../components/common/OptimizedList';

<OptimizedList
  data={items}
  renderItem={renderItem}
  estimatedItemSize={100}
  keyExtractor={(item) => item.id}
/>
```

**Benefícios:**
- Performance 10x melhor que FlatList
- Recycling automático de views
- Menor uso de memória
- Scroll suave mesmo com milhares de itens

**Configurações otimizadas:**
```tsx
// Otimizações aplicadas automaticamente:
- drawDistance: 200
- recycleItems: true
- removeClippedSubviews: true
- maintainVisibleContentPosition
```

### 4. Redux Store Otimizado

**Seletores memoizados com Reselect:**
```typescript
// src/store/selectors/index.ts
import { createSelector } from 'reselect';

// Seletores otimizados evitam recálculos
export const selectCartTotal = createSelector(
  [selectCartSubtotal, selectCart],
  (subtotal, cart) => {
    const discount = cart.coupon ? cart.coupon.discount : 0;
    const shipping = cart.shippingCost || 0;
    return subtotal - discount + shipping;
  }
);
```

**Benefícios:**
- Evita re-renders desnecessários
- Cálculos complexos são memoizados
- Melhor performance em componentes conectados

**Uso em componentes:**
```tsx
import { useSelector } from 'react-redux';
import { selectCartTotal } from '../store/selectors';

const CartScreen = () => {
  const total = useSelector(selectCartTotal);
  // ...
};
```

### 5. Navegação Otimizada

**Configurações aplicadas:**
```tsx
// src/navigation/AppNavigator.tsx
<Tab.Navigator
  screenOptions={{
    // Descarrega telas inativas da memória
    detachInactiveScreens: true,
    // Carrega tabs sob demanda
    lazy: true,
  }}
>
```

**Lazy loading de telas:**
```tsx
const LazyScreen = ({ component: Component, ...props }) => (
  <Suspense fallback={<LoadingScreen />}>
    <Component {...props} />
  </Suspense>
);
```

### 6. Hermes Engine

**Status:** ✅ Habilitado para Android e iOS

**Benefícios:**
- Reduz tempo de inicialização em ~50%
- Menor uso de memória
- Melhor performance de JavaScript

**Verificar status:**
```javascript
// No app
console.log('Hermes enabled:', !!global.HermesInternal);
```

## 📋 Checklist de Performance

### Desenvolvimento de Novos Componentes

- [ ] Use `React.memo` para componentes puros
- [ ] Implemente `shouldComponentUpdate` quando necessário
- [ ] Use callbacks memoizados com `useCallback`
- [ ] Memoize valores computados com `useMemo`
- [ ] Evite funções inline em props
- [ ] Use `keyExtractor` eficiente em listas

### Imagens

- [ ] Use `OptimizedImage` em vez de `Image`
- [ ] Forneça dimensões fixas quando possível
- [ ] Use placeholder durante carregamento
- [ ] Implemente lazy loading para imagens grandes
- [ ] Otimize imagens antes do upload (WebP, compressão)

### Listas

- [ ] Use `OptimizedList` (FlashList) em vez de FlatList
- [ ] Defina `estimatedItemSize` corretamente
- [ ] Use `getItemLayout` quando os itens têm altura fixa
- [ ] Implemente `keyExtractor` eficiente
- [ ] Evite componentes complexos no `renderItem`

### Estado Global

- [ ] Use seletores do `src/store/selectors`
- [ ] Evite selecionar todo o estado
- [ ] Normalize dados para evitar duplicação
- [ ] Use `createEntityAdapter` para coleções

### Navegação

- [ ] Lazy load telas não críticas
- [ ] Pré-carregue telas que serão acessadas em breve
- [ ] Use deep linking para navegação direta
- [ ] Configure `detachInactiveScreens`

## 🔧 Ferramentas de Análise

### Bundle Analyzer
```bash
# Analisar tamanho do bundle
npm run analyze:bundle

# Gera relatório em: bundle-reports/
```

### React DevTools Profiler
```bash
# Instalar
npm install -g react-devtools

# Executar
react-devtools
```

### Flipper
- Performance Monitor
- Network Inspector
- Layout Inspector
- React DevTools

## 🎯 Otimizações Futuras

### Curto Prazo
1. **Implementar React.lazy para mais componentes**
   - Modais pesados
   - Componentes de funcionalidades opcionais

2. **Otimizar importações**
   - Evitar importações de barrel exports
   - Use importações específicas

3. **Implementar Service Worker** (Web)
   - Cache de assets
   - Offline first

### Médio Prazo
1. **RAM Bundles** (Android)
   - Carregamento de módulos sob demanda
   - Reduz uso de memória inicial

2. **Inline Requires**
   - Atrasar importações até serem necessárias
   - Melhora tempo de inicialização

3. **Otimização de Re-renders**
   - Implementar why-did-you-render
   - Identificar e corrigir re-renders desnecessários

### Longo Prazo
1. **Migração para React Native New Architecture**
   - Fabric Renderer
   - TurboModules
   - JSI (JavaScript Interface)

2. **WebAssembly para operações pesadas**
   - Cálculos complexos
   - Processamento de imagens

## 📈 Monitoramento Contínuo

### Métricas a Acompanhar
1. **Bundle Size**
   - JavaScript bundle
   - Assets totais
   - Tamanho do APK/IPA

2. **Runtime Performance**
   - Tempo de inicialização
   - FPS em diferentes telas
   - Uso de memória
   - Tempo de resposta da API

3. **User Experience**
   - Time to Interactive (TTI)
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)

### Ferramentas Recomendadas
- **Firebase Performance Monitoring**
- **Sentry Performance**
- **Custom Analytics Events**

## 🚨 Problemas Comuns e Soluções

### Lista com performance ruim
**Problema:** FPS baixo ao fazer scroll
**Solução:** 
- Migre para OptimizedList (FlashList)
- Reduza complexidade do renderItem
- Use getItemLayout se possível

### Imagens demorando para carregar
**Problema:** Imagens grandes sem otimização
**Solução:**
- Use OptimizedImage com FastImage
- Implemente placeholder
- Otimize imagens no servidor

### Re-renders excessivos
**Problema:** Componentes re-renderizando sem necessidade
**Solução:**
- Use React.memo
- Implemente seletores memoizados
- Evite criar objetos/arrays inline

### Bundle muito grande
**Problema:** App demora para inicializar
**Solução:**
- Implemente code splitting
- Remove dependências não usadas
- Use dynamic imports

## 📚 Recursos Adicionais

- [React Native Performance](https://reactnative.dev/docs/performance)
- [FlashList Documentation](https://shopify.github.io/flash-list/)
- [Reselect Documentation](https://github.com/reduxjs/reselect)
- [FastImage Documentation](https://github.com/DylanVann/react-native-fast-image)

---

**Última atualização:** 2025-01-09
**Mantenedor:** Equipe Crowbar Mobile