/**
 * Hook para animações com gestos
 */

import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import {
  Gesture,
} from 'react-native-gesture-handler';
import {
  panGesture,
  swipeGesture,
  pinchGesture,
  rotationGesture,
  dragDropGesture,
} from '../animations/gestureAnimations';
import { SPRING_CONFIGS } from '../animations/constants';

interface UseGestureAnimationsOptions {
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  enableHaptic?: boolean;
  onGestureEnd?: () => void;
}

// Hook para pan gesture (arrastar)
export const usePanGesture = (options: UseGestureAnimationsOptions = {}) => {
  const {
    minX = -Infinity,
    maxX = Infinity,
    _minY = -Infinity,
    _maxY = Infinity,
    enableHaptic = true,
    onGestureEnd,
  } = options;

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onStart(() => {
      panGesture.onStart(translateX, translateY, startX, startY, {
        haptic: enableHaptic,
      });
    })
    .onUpdate((event) => {
      panGesture.onUpdate(
        event,
        translateX,
        translateY,
        startX,
        startY,
        { minValue: minX, maxValue: maxX }
      );
    })
    .onEnd((event) => {
      panGesture.onEnd(event, translateX, translateY, {
        haptic: enableHaptic,
        onComplete: onGestureEnd,
      });
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  const reset = useCallback(() => {
    'worklet';
    translateX.value = withSpring(0, SPRING_CONFIGS.smooth);
    translateY.value = withSpring(0, SPRING_CONFIGS.smooth);
  }, []);

  return {
    gesture,
    animatedStyle,
    position: { x: translateX, y: translateY },
    reset,
  };
};

// Hook para swipe gesture
export const useSwipeGesture = (
  itemCount: number,
  itemWidth: number,
  options: { enableHaptic?: boolean; onSwipe?: (_index: number) => void } = {}
) => {
  const { enableHaptic = true, onSwipe } = options;

  const translateX = useSharedValue(0);
  const currentIndex = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onEnd((event) => {
      const previousIndex = currentIndex.value;
      
      swipeGesture.onEnd(
        event,
        translateX,
        currentIndex,
        itemWidth,
        itemCount - 1,
        { haptic: enableHaptic }
      );

      if (onSwipe && currentIndex.value !== previousIndex) {
        runOnJS(onSwipe)(currentIndex.value);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const goToIndex = useCallback((_index: number) => {
    'worklet';
    currentIndex.value = 0;
    translateX.value = withSpring(-_index * itemWidth, SPRING_CONFIGS.smooth);
  }, [itemWidth]);

  return {
    gesture,
    animatedStyle,
    currentIndex,
    goToIndex,
  };
};

// Hook para pinch gesture (zoom)
export const usePinchGesture = (
  options: {
    minScale?: number;
    maxScale?: number;
    enableHaptic?: boolean;
  } = {}
) => {
  const {
    minScale = 0.5,
    maxScale = 3,
    enableHaptic = true,
  } = options;

  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);

  const gesture = Gesture.Pinch()
    .onStart(() => {
      pinchGesture.onStart(scale, startScale, { haptic: enableHaptic });
    })
    .onUpdate((event) => {
      pinchGesture.onUpdate(event, scale, startScale, {
        minValue: minScale,
        maxValue: maxScale,
      });
    })
    .onEnd(() => {
      pinchGesture.onEnd(scale, {
        minValue: minScale,
        maxValue: maxScale,
      });
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const reset = useCallback(() => {
    'worklet';
    scale.value = withSpring(1, SPRING_CONFIGS.smooth);
  }, []);

  return {
    gesture,
    animatedStyle,
    scale,
    reset,
  };
};

// Hook para rotation gesture
export const useRotationGesture = (
  options: { enableHaptic?: boolean; snapToAngles?: boolean } = {}
) => {
  const { enableHaptic = true, snapToAngles = true } = options;

  const rotation = useSharedValue(0);
  const startRotation = useSharedValue(0);

  const gesture = Gesture.Rotation()
    .onStart(() => {
      rotationGesture.onStart(rotation, startRotation, {
        haptic: enableHaptic,
      });
    })
    .onUpdate((event) => {
      rotationGesture.onUpdate(event, rotation, startRotation);
    })
    .onEnd(() => {
      if (snapToAngles) {
        rotationGesture.onEnd(rotation, { haptic: enableHaptic });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const reset = useCallback(() => {
    'worklet';
    rotation.value = withSpring(0, SPRING_CONFIGS.smooth);
  }, []);

  return {
    gesture,
    animatedStyle,
    rotation,
    reset,
  };
};

// Hook para drag and drop
export const useDragDropGesture = (
  options: {
    dropZones?: Array<{ x: number; y: number; width: number; height: number }>;
    enableHaptic?: boolean;
    onDrop?: (zoneIndex: number) => void;
  } = {}
) => {
  const { dropZones = [], enableHaptic = true, onDrop } = options;

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const checkDropZone = (x: number, y: number) => {
    'worklet';
    for (let i = 0; i < dropZones.length; i++) {
      const zone = dropZones[i];
      if (
        x >= zone.x &&
        x <= zone.x + zone.width &&
        y >= zone.y &&
        y <= zone.y + zone.height
      ) {
        return i;
      }
    }
    return -1;
  };

  const gesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
      dragDropGesture.onStart(scale, opacity, { haptic: enableHaptic });
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    })
    .onEnd(() => {
      const dropZoneIndex = checkDropZone(
        translateX.value,
        translateY.value
      );

      if (dropZoneIndex >= 0 && onDrop) {
        runOnJS(onDrop)(dropZoneIndex);
      }

      dragDropGesture.onDrop(
        scale,
        opacity,
        translateX,
        translateY,
        0,
        0,
        { haptic: enableHaptic }
      );
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  return {
    gesture,
    animatedStyle,
    position: { x: translateX, y: translateY },
  };
};

// Hook combinado para múltiplos gestos
export const useComposedGesture = (
  options: {
    enablePan?: boolean;
    enablePinch?: boolean;
    enableRotation?: boolean;
    enableHaptic?: boolean;
  } = {}
) => {
  const {
    enablePan = true,
    enablePinch = true,
    enableRotation = true,
    enableHaptic = true,
  } = options;

  const pan = usePanGesture({ enableHaptic });
  const pinch = usePinchGesture({ enableHaptic });
  const rotation = useRotationGesture({ enableHaptic });

  const composedGesture = Gesture.Simultaneous(
    ...[
      enablePan && pan.gesture,
      enablePinch && pinch.gesture,
      enableRotation && rotation.gesture,
    ].filter(Boolean)
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        ...(enablePan ? [
          { translateX: pan.position.x.value },
          { translateY: pan.position.y.value },
        ] : []),
        ...(enablePinch ? [{ scale: pinch.scale.value }] : []),
        ...(enableRotation ? [{ rotate: `${rotation.rotation.value}deg` }] : []),
      ],
    };
  });

  const reset = useCallback(() => {
    if (enablePan) pan.reset();
    if (enablePinch) pinch.reset();
    if (enableRotation) rotation.reset();
  }, [enablePan, enablePinch, enableRotation]);

  return {
    gesture: composedGesture,
    animatedStyle,
    reset,
  };
};