# Sistema de Animações - Crowbar Mobile

Sistema completo de animações e micro-interações utilizando React Native Reanimated 3, Gesture Handler e Lottie.

## 📚 Estrutura

```
src/animations/
├── index.ts                 # Exportações centralizadas
├── constants.ts            # Constantes de animação (durações, easings, etc)
├── animations.ts           # Biblioteca de animações básicas
├── microInteractions.ts    # Micro-interações para botões e elementos
├── transitions.ts          # Transições entre telas
├── gestureAnimations.ts    # Animações com gestos
├── lottieAnimations.ts     # Configurações Lottie
├── skeletonAnimations.ts   # Animações de loading skeleton
├── listAnimations.ts       # Animações para listas
├── feedbackAnimations.ts   # Animações de feedback
└── performanceConfig.ts    # Otimizações de performance
```

## 🚀 Uso Rápido

### Componentes Animados

```tsx
import { AnimatedButton, AnimatedCard, AnimatedTabBar } from '@/components/animated';

// Botão animado
<AnimatedButton
  title="Clique-me"
  variant="primary"
  icon="heart"
  onPress={() => console.log('Clicado!')}
/>

// Card animado
<AnimatedCard elevation={4} onPress={handlePress}>
  <Text>Conteúdo do card</Text>
</AnimatedCard>

// TabBar animada
<AnimatedTabBar
  tabs={tabs}
  selectedIndex={selectedTab}
  onTabPress={setSelectedTab}
/>
```

### Hooks de Animação

```tsx
import { useReanimatedAnimations, useEntranceAnimation } from '@/hooks/useReanimatedAnimations';

// Animação de entrada
const animation = useEntranceAnimation('combined', { autoStart: true });

return (
  <Animated.View style={animation.animatedStyle}>
    <YourContent />
  </Animated.View>
);
```

### Gestos

```tsx
import { usePanGesture, usePinchGesture } from '@/hooks/useGestureAnimations';
import { GestureDetector } from 'react-native-gesture-handler';

// Pan gesture (arrastar)
const panGesture = usePanGesture({ minX: -100, maxX: 100 });

<GestureDetector gesture={panGesture.gesture}>
  <Animated.View style={panGesture.animatedStyle}>
    <Card />
  </Animated.View>
</GestureDetector>
```

## 🎨 Animações Disponíveis

### Animações Básicas
- `fadeIn` / `fadeOut` - Fade com opacidade
- `scaleIn` / `scaleOut` - Escala
- `slideIn` (left/right/top/bottom) - Slide direcional
- `rotate` / `spin` - Rotação
- `pulse` - Pulsação
- `bounce` - Bounce effect

### Micro-interações
- `buttonPress` - Feedback de press em botões
- `rippleEffect` - Efeito ripple
- `toggleAnimation` - Switch/checkbox
- `tabSelection` - Seleção de tabs
- `pullToRefresh` - Pull to refresh customizado

### Transições
- `screenFadeTransition` - Fade entre telas
- `screenSlideHorizontal` - Slide horizontal
- `modalTransition` - Transição de modal
- `heroTransition` - Transição hero element
- `accordionTransition` - Accordion expand/collapse

### Feedback
- `successAnimation` - Animação de sucesso
- `errorAnimation` - Animação de erro (shake)
- `loadingAnimation` - Loading spinner
- `progressAnimation` - Barra de progresso
- `notificationAnimation` - Notificação slide-in

## ⚡ Performance

### Otimizações Implementadas

1. **Native Driver**: Todas as animações usam `useNativeDriver: true`
2. **Worklets**: Cálculos executados no thread de UI
3. **Batch Updates**: Múltiplas animações agrupadas
4. **Lazy Loading**: Componentes carregados sob demanda
5. **Gesture Optimization**: Otimizações específicas para gestos

### Boas Práticas

```tsx
// ✅ BOM - Anima transform e opacity
<Animated.View style={{
  transform: [{ scale }],
  opacity,
}} />

// ❌ EVITAR - Anima propriedades de layout
<Animated.View style={{
  width,  // Evitar
  height, // Evitar
  margin, // Evitar
}} />
```

## 🎯 Exemplos Comuns

### Loading Skeleton

```tsx
import { SkeletonCard, SkeletonText } from '@/components/animated';

// Durante o carregamento
{isLoading ? (
  <SkeletonCard preset="boxCard" />
) : (
  <BoxCard data={data} />
)}
```

### Lista Animada

```tsx
import { useListAnimation } from '@/hooks/useReanimatedAnimations';

const listAnimation = useListAnimation(items.length, {
  staggerDelay: 100,
  animationType: 'fade'
});

{items.map((item, index) => (
  <Animated.View
    key={item.id}
    style={listAnimation.getAnimatedStyle(index)}
  >
    <ItemCard item={item} />
  </Animated.View>
))}
```

### Feedback Háptico

```tsx
// Todas as micro-interações incluem feedback háptico
<AnimatedButton
  title="Ação"
  haptic={true}  // Habilitado por padrão
  onPress={handleAction}
/>
```

## 🔧 Configuração

### Constantes Personalizadas

```tsx
import { DURATIONS, SPRING_CONFIGS } from '@/animations/constants';

// Usar durações padronizadas
const customAnimation = withTiming(1, {
  duration: DURATIONS.normal, // 300ms
});

// Usar spring configs
const springAnimation = withSpring(1, SPRING_CONFIGS.bouncy);
```

### Performance Config

```tsx
import { animationPerformanceConfig } from '@/animations/performanceConfig';

// Verificar se deve animar
if (animationPerformanceConfig.helpers.shouldAnimate('high')) {
  // Executar animação complexa
}
```

## 📱 Componentes Disponíveis

- `AnimatedButton` - Botão com feedback visual e háptico
- `AnimatedCard` - Card com efeitos de hover/press
- `AnimatedTabBar` - TabBar com indicadores animados
- `AnimatedCheckbox` - Checkbox com micro-interações
- `AnimatedRadio` - Radio button animado
- `AnimatedProgressBar` - Barra de progresso
- `AnimatedSkeleton` - Loading skeleton

## 🎮 Gestos Suportados

- **Pan** - Arrastar elementos
- **Pinch** - Zoom com pinça
- **Rotation** - Rotação com dois dedos
- **Swipe** - Swipe para navegar
- **Long Press** - Press longo com feedback
- **Drag & Drop** - Arrastar e soltar

## 📊 Monitoramento

Em desenvolvimento, o sistema monitora:
- FPS (Frames por segundo)
- Frame drops
- Uso de memória
- Performance de animações

## 🚨 Troubleshooting

### Animação não funciona
- Verificar se `useNativeDriver: true`
- Confirmar importação de `react-native-reanimated`
- Verificar se babel.config.js inclui plugin do Reanimated

### Performance ruim
- Reduzir número de animações simultâneas
- Usar `InteractionManager.runAfterInteractions()`
- Verificar re-renders com React DevTools

### Gesture não responde
- Confirmar wrap com `GestureHandlerRootView`
- Verificar ordem dos gesture handlers
- Usar `simultaneousHandlers` se necessário

---

Para mais exemplos, veja `/src/examples/AnimationExamples.tsx`