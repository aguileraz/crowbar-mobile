# Advanced Box Opening Animation System

Este sistema fornece uma experiência completa de abertura de caixas misteriosas com animações de sprite sheet, sistema de reações emoji, gamificação e otimizações de performance.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Componentes Principais](#componentes-principais)
- [Configuração](#configuração)
- [Uso Básico](#uso-básico)
- [Temas](#temas)
- [Performance](#performance)
- [Acessibilidade](#acessibilidade)
- [Troubleshooting](#troubleshooting)

## 🎯 Visão Geral

O sistema de animações avançado do Crowbar Mobile oferece:

- **Sprite Sheet Animations**: Animações com 350+ frames usando React Native Reanimated 3.x
- **Múltiplos Temas**: Fire, Ice, Meteor e Classic com configurações únicas
- **Sistema de Emoji**: Reações gamificadas com física e raridades
- **Otimização Automática**: Adaptação baseada na performance do dispositivo
- **Acessibilidade Completa**: Suporte a reduce motion, haptics e screen readers
- **Cache Inteligente**: Preload e gerenciamento de memória automático

## 🏗️ Arquitetura

```
src/components/animations/
├── SpriteSheetAnimator.tsx          # Componente de animação principal
├── EmojiReactionSystem.tsx          # Sistema de reações emoji
├── AdvancedBoxOpeningContainer.tsx  # Container orquestrador
├── README.md                        # Este arquivo

src/services/
├── animationManager.ts              # Gerenciador de themes e cache

src/store/slices/
├── advancedBoxOpeningSlice.ts       # Estado Redux avançado

src/types/
├── animations.ts                    # Interfaces TypeScript

src/utils/
├── performanceOptimizer.ts          # Otimizações de performance
├── accessibilityHelpers.ts          # Helpers de acessibilidade
```

## 🔧 Componentes Principais

### 1. SpriteSheetAnimator

Componente principal que renderiza animações de sprite sheet:

```tsx
import SpriteSheetAnimator from '../components/animations/SpriteSheetAnimator';

<SpriteSheetAnimator
  theme={currentTheme}
  shouldPlay={isPlaying}
  onAnimationComplete={handleComplete}
  onFrameChange={handleFrameChange}
  enableInterruption={true}
  reduceMotion={false}
/>
```

### 2. EmojiReactionSystem

Sistema de reações interativas com física:

```tsx
import EmojiReactionSystem from '../components/animations/EmojiReactionSystem';

<EmojiReactionSystem
  onReactionTrigger={handleEmojiReaction}
  onPointsEarned={handlePointsEarned}
  maxActiveReactions={20}
  enablePhysics={true}
/>
```

### 3. AdvancedBoxOpeningContainer

Container principal que integra todos os sistemas:

```tsx
import AdvancedBoxOpeningContainer from '../components/animations/AdvancedBoxOpeningContainer';

<AdvancedBoxOpeningContainer
  boxId="box123"
  initialTheme="fire"
  onAnimationComplete={handleComplete}
  onError={handleError}
  enableDebugMode={__DEV__}
/>
```

## ⚙️ Configuração

### 1. Configurar Redux Store

```tsx
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import advancedBoxOpeningReducer from './slices/advancedBoxOpeningSlice';

export const store = configureStore({
  reducer: {
    advancedBoxOpening: advancedBoxOpeningReducer,
  },
});
```

### 2. Inicializar Sistemas

```tsx
// App.tsx
import { useEffect } from 'react';
import { performanceOptimizer } from './utils/performanceOptimizer';
import { accessibilityManager } from './utils/accessibilityHelpers';

function App() {
  useEffect(() => {
    const initializeSystems = async () => {
      // Inicializar otimizador de performance
      await performanceOptimizer.initialize();
      
      // Inicializar gerenciador de acessibilidade
      await accessibilityManager.initialize();
    };

    initializeSystems();
  }, []);

  return (
    // Seu app aqui
  );
}
```

### 3. Configurar Assets

Coloque os sprite sheets na pasta de assets:

```
src/assets/animations/
├── fire_opening.png          # 350+ frames para tema fogo
├── fire_explosion.png        # 200+ frames de explosão
├── ice_opening.png           # Tema gelo
├── meteor_opening.png        # Tema meteoro
├── classic_opening.png       # Tema clássico
```

## 🎨 Temas

### Tema Fire
```tsx
const fireTheme = {
  colors: {
    primary: '#FF4444',
    secondary: '#FF8844',
    glow: '#FFAA44'
  },
  effects: {
    enableHaptics: true,
    enableGlow: true,
    enableScreenShake: true,
    particleCount: 20
  }
};
```

### Tema Ice
```tsx
const iceTheme = {
  colors: {
    primary: '#44AAFF',
    secondary: '#66CCFF',
    glow: '#AAEEFF'
  },
  effects: {
    enableHaptics: true,
    enableGlow: true,
    enableScreenShake: false,
    particleCount: 15
  }
};
```

### Tema Meteor
```tsx
const meteorTheme = {
  colors: {
    primary: '#AA44FF',
    secondary: '#CC66FF',
    glow: '#EE88FF'
  },
  effects: {
    enableHaptics: true,
    enableGlow: true,
    enableScreenShake: true,
    particleCount: 30
  }
};
```

## 📈 Performance

### Otimização Automática

O sistema adapta automaticamente baseado no dispositivo:

```tsx
// Dispositivos de baixa performance
const lowEndSettings = {
  targetFPS: 30,
  particleCount: 5,
  enableBlur: false,
  textureQuality: 'low'
};

// Dispositivos flagship
const highEndSettings = {
  targetFPS: 60,
  particleCount: 30,
  enableBlur: true,
  textureQuality: 'high'
};
```

### Monitoramento

```tsx
// Verificar performance em tempo real
const metrics = performanceOptimizer.getCurrentMetrics();
console.log(`FPS: ${metrics.fps}, Memory: ${metrics.memoryUsage}MB`);

// Gerar relatório
const report = performanceOptimizer.generatePerformanceReport();
console.log(report);
```

## ♿ Acessibilidade

### Reduce Motion

```tsx
import { accessibilityManager } from '../utils/accessibilityHelpers';

const config = accessibilityManager.getConfig();
if (config.reduceMotion) {
  // Usar animações simplificadas ou estáticas
}
```

### Haptic Feedback

```tsx
// Haptic automático baseado no estado
await accessibilityManager.triggerHapticFeedback('opening');

// Sequência customizada
await accessibilityManager.triggerComplexHapticSequence([
  { type: 'light', delay: 0 },
  { type: 'medium', delay: 100 },
  { type: 'heavy', delay: 200 }
]);
```

### Screen Reader

```tsx
// Anúncios automáticos
accessibilityManager.announceForScreenReader('opening');

// Anúncios de progresso
accessibilityManager.announceProgress('revealing', 75);
```

## 📱 Uso Básico

### Exemplo Completo

```tsx
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AdvancedBoxOpeningContainer from '../components/animations/AdvancedBoxOpeningContainer';
import { 
  preloadAnimationThemes,
  setCurrentBox,
  selectCurrentBox 
} from '../store/slices/advancedBoxOpeningSlice';

const BoxOpeningScreen = ({ route }) => {
  const dispatch = useDispatch();
  const { boxId } = route.params;
  const currentBox = useSelector(selectCurrentBox);

  useEffect(() => {
    // Preload dos temas
    dispatch(preloadAnimationThemes(['fire', 'ice', 'meteor']));
    
    // Definir caixa atual (buscar dados da API)
    dispatch(setCurrentBox(boxData));
  }, [dispatch, boxId]);

  const handleAnimationComplete = () => {
    console.log('Animação concluída!');
    // Navegar para tela de resultados
  };

  const handleError = (error) => {
    console.error('Erro na animação:', error);
    // Mostrar fallback ou retry
  };

  return (
    <View style={styles.container}>
      <AdvancedBoxOpeningContainer
        boxId={boxId}
        initialTheme="fire"
        onAnimationComplete={handleAnimationComplete}
        onError={handleError}
        enableDebugMode={__DEV__}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default BoxOpeningScreen;
```

### Hooks Personalizados

```tsx
// Hook para controle de animação
const useBoxOpeningAnimation = (boxId: string) => {
  const dispatch = useDispatch();
  const animationState = useSelector(selectAnimationSystemState);
  
  const openBox = useCallback(async (theme?: ThemeType) => {
    await dispatch(openMysteryBoxAdvanced({ boxId, themeOverride: theme }));
  }, [dispatch, boxId]);

  const skipAnimation = useCallback(() => {
    dispatch(setAnimationState('completed'));
  }, [dispatch]);

  return {
    animationState,
    openBox,
    skipAnimation,
    isPlaying: animationState.currentState === 'opening',
  };
};

// Hook para sistema de emoji
const useEmojiReactions = () => {
  const dispatch = useDispatch();
  const emojiSystem = useSelector(selectEmojiSystem);
  
  const addReaction = useCallback((emoji: string, points: number) => {
    dispatch(addEmojiReaction({
      id: `${Date.now()}_${Math.random()}`,
      emoji,
      points,
    }));
  }, [dispatch]);

  return {
    emojiSystem,
    addReaction,
    totalPoints: emojiSystem.totalPoints,
    activeReactions: emojiSystem.activeReactions,
  };
};
```

## 🔧 Troubleshooting

### Performance Issues

```tsx
// Verificar se há problemas de performance
const optimizer = performanceOptimizer;
if (optimizer.getCurrentMetrics().fps < 30) {
  // Reduzir qualidade automaticamente
  optimizer.enableEmergencyMode();
}

// Limpeza manual de memória
optimizer.forceMemoryCleanup();
```

### Animações não Carregam

```tsx
// Verificar status de preload
const themeStatus = useSelector(selectThemePreloadStatus);
if (themeStatus.fire === 'error') {
  // Tentar novamente ou usar fallback
  dispatch(preloadAnimationThemes(['classic']));
}
```

### Problemas de Acessibilidade

```tsx
// Verificar configurações
const accessConfig = accessibilityManager.getConfig();
if (accessConfig.reduceMotion && !usingStaticFallback) {
  // Implementar fallback estático
  setUsingStaticFallback(true);
}
```

### Debug Mode

```tsx
// Habilitar modo debug para diagnósticos
<AdvancedBoxOpeningContainer
  enableDebugMode={true} // Mostra métricas na tela
/>

// Logs detalhados
console.log(performanceOptimizer.generatePerformanceReport());
console.log(accessibilityManager.generateAccessibilityReport());
```

## 📚 APIs Principais

### AnimationManager
- `preloadAnimations(themes, config)` - Preload de temas
- `getTheme(themeType)` - Obter tema carregado
- `isThemeLoaded(themeType)` - Verificar se tema está carregado
- `cleanupCache()` - Limpeza de cache
- `forceMemoryCleanup()` - Limpeza forçada

### PerformanceOptimizer
- `initialize()` - Inicializar detector
- `updateMetrics(metrics)` - Atualizar métricas
- `getCurrentSettings()` - Obter configurações atuais
- `optimizeTheme(theme)` - Otimizar tema
- `enableEmergencyMode()` - Modo de emergência

### AccessibilityManager
- `initialize()` - Detectar configurações
- `triggerHapticFeedback(state)` - Haptic feedback
- `announceForScreenReader(state)` - Anúncios
- `getAdaptedAnimationConfig()` - Config adaptada
- `getAccessibilityProps(state)` - Props para componentes

---

**Desenvolvido para Crowbar Mobile** 🎁✨

Este sistema foi projetado para fornecer a melhor experiência de abertura de caixas misteriosas em dispositivos móveis, com foco em performance, acessibilidade e gamificação.