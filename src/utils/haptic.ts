/**
 * Simple haptic feedback utility
 */

import { Platform } from 'react-native';

export const hapticFeedback = (type: string = 'impactLight') => {
  // Haptic feedback is platform specific
  // This is a placeholder that can be enhanced with actual haptic libraries
  if (Platform.OS === 'ios') {
    // iOS haptic feedback
    try {
      const ReactNativeHapticFeedback = require('react-native-haptic-feedback').default;
      ReactNativeHapticFeedback.trigger(type);
    } catch (error) {
      // Haptic library not available
      console.warn('Haptic feedback not available');
    }
  } else if (Platform.OS === 'android') {
    // Android haptic feedback
    try {
      const { Vibration } = require('react-native');
      Vibration.vibrate(10);
    } catch (error) {
      // Vibration not available
      console.warn('Vibration not available');
    }
  }
};

export default hapticFeedback;