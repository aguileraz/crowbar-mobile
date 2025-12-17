/**
 * Testes para utilitário de feedback háptico
 *
 * Cobertura:
 * - Detecção de plataforma (iOS vs Android)
 * - Todos os tipos de feedback háptico
 * - Fallback quando biblioteca indisponível
 * - Tratamento de erros
 * - Cenários específicos por plataforma
 * - Múltiplas chamadas consecutivas
 */

// Mock react-native-haptic-feedback antes de qualquer import
const mockTrigger = jest.fn();
jest.mock('react-native-haptic-feedback', () => ({
  default: {
    trigger: mockTrigger,
  },
}), { virtual: true });

import { hapticFeedback } from '../haptic';
import { Platform, Vibration } from 'react-native';

describe('hapticFeedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios'; // Resetar para iOS por padrão
  });

  describe('iOS Platform', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    it('deve disparar feedback háptico padrão (impactLight) no iOS', () => {
      hapticFeedback();

      expect(mockTrigger).toHaveBeenCalledTimes(1);
      expect(mockTrigger).toHaveBeenCalledWith('impactLight');
      expect(Vibration.vibrate).not.toHaveBeenCalled();
    });

    it('deve disparar feedback háptico light no iOS', () => {
      hapticFeedback('light');

      expect(mockTrigger).toHaveBeenCalledTimes(1);
      expect(mockTrigger).toHaveBeenCalledWith('light');
    });

    it('deve disparar feedback háptico medium no iOS', () => {
      hapticFeedback('medium');

      expect(mockTrigger).toHaveBeenCalledTimes(1);
      expect(mockTrigger).toHaveBeenCalledWith('medium');
    });

    it('deve disparar feedback háptico heavy no iOS', () => {
      hapticFeedback('heavy');

      expect(mockTrigger).toHaveBeenCalledTimes(1);
      expect(mockTrigger).toHaveBeenCalledWith('heavy');
    });

    it('deve disparar feedback de sucesso no iOS', () => {
      hapticFeedback('notificationSuccess');

      expect(mockTrigger).toHaveBeenCalledTimes(1);
      expect(mockTrigger).toHaveBeenCalledWith('notificationSuccess');
    });

    it('deve disparar feedback de warning no iOS', () => {
      hapticFeedback('notificationWarning');

      expect(mockTrigger).toHaveBeenCalledTimes(1);
      expect(mockTrigger).toHaveBeenCalledWith('notificationWarning');
    });

    it('deve disparar feedback de erro no iOS', () => {
      hapticFeedback('notificationError');

      expect(mockTrigger).toHaveBeenCalledTimes(1);
      expect(mockTrigger).toHaveBeenCalledWith('notificationError');
    });

    it('deve disparar feedback de seleção no iOS', () => {
      hapticFeedback('selection');

      expect(mockTrigger).toHaveBeenCalledTimes(1);
      expect(mockTrigger).toHaveBeenCalledWith('selection');
    });

    it('deve lidar com múltiplas chamadas consecutivas no iOS', () => {
      hapticFeedback('impactLight');
      hapticFeedback('impactMedium');
      hapticFeedback('impactHeavy');

      expect(mockTrigger).toHaveBeenCalledTimes(3);
      expect(mockTrigger).toHaveBeenNthCalledWith(1, 'impactLight');
      expect(mockTrigger).toHaveBeenNthCalledWith(2, 'impactMedium');
      expect(mockTrigger).toHaveBeenNthCalledWith(3, 'impactHeavy');
    });

    it('deve lidar graciosamente com erros da biblioteca háptica no iOS', () => {
      mockTrigger.mockImplementationOnce(() => {
        throw new Error('Haptic error');
      });

      // Não deve lançar erro
      expect(() => hapticFeedback('impactLight')).not.toThrow();
      expect(mockTrigger).toHaveBeenCalledTimes(1);
    });
  });

  describe('Android Platform', () => {
    beforeEach(() => {
      Platform.OS = 'android';
    });

    it('deve disparar vibração no Android', () => {
      hapticFeedback();

      expect(Vibration.vibrate).toHaveBeenCalledTimes(1);
      expect(Vibration.vibrate).toHaveBeenCalledWith(10);
      expect(mockTrigger).not.toHaveBeenCalled();
    });

    it('deve ignorar tipo de feedback háptico no Android e usar vibração', () => {
      hapticFeedback('notificationSuccess');

      expect(Vibration.vibrate).toHaveBeenCalledTimes(1);
      expect(Vibration.vibrate).toHaveBeenCalledWith(10);
      expect(mockTrigger).not.toHaveBeenCalled();
    });

    it('deve lidar com múltiplas chamadas consecutivas no Android', () => {
      hapticFeedback('impactLight');
      hapticFeedback('impactMedium');
      hapticFeedback('impactHeavy');

      expect(Vibration.vibrate).toHaveBeenCalledTimes(3);
      expect(Vibration.vibrate).toHaveBeenCalledWith(10);
    });

    it('deve lidar graciosamente quando Vibration não está disponível no Android', () => {
      (Vibration.vibrate as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Vibration not available');
      });

      // Não deve lançar erro
      expect(() => hapticFeedback()).not.toThrow();
      expect(Vibration.vibrate).toHaveBeenCalledTimes(1);
    });

    it('deve lidar graciosamente com erros de vibração no Android', () => {
      (Vibration.vibrate as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Vibration error');
      });

      // Não deve lançar erro
      expect(() => hapticFeedback('impactLight')).not.toThrow();
      expect(Vibration.vibrate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cross-platform Behavior', () => {
    it('deve aceitar tipo de feedback customizado sem lançar erro', () => {
      Platform.OS = 'ios';

      expect(() => hapticFeedback('customType')).not.toThrow();
      expect(mockTrigger).toHaveBeenCalledWith('customType');
    });

    it('não deve disparar feedback em plataformas não suportadas', () => {
      Platform.OS = 'web' as any;

      hapticFeedback('impactLight');

      expect(mockTrigger).not.toHaveBeenCalled();
      expect(Vibration.vibrate).not.toHaveBeenCalled();
    });

    it('deve lidar com valores undefined graciosamente', () => {
      Platform.OS = 'ios';

      expect(() => hapticFeedback(undefined as any)).not.toThrow();
      expect(mockTrigger).toHaveBeenCalledWith('impactLight'); // fallback para padrão
    });

    it('deve lidar com valores null graciosamente', () => {
      Platform.OS = 'ios';

      expect(() => hapticFeedback(null as any)).not.toThrow();
      // null não é string vazia, então passa como argumento
    });

    it('deve lidar com string vazia graciosamente', () => {
      Platform.OS = 'ios';

      expect(() => hapticFeedback('')).not.toThrow();
      expect(mockTrigger).toHaveBeenCalledWith('');
    });
  });

  describe('Export Validation', () => {
    it('deve exportar hapticFeedback como named export', () => {
      const { hapticFeedback: namedExport } = require('../haptic');
      expect(namedExport).toBeDefined();
      expect(typeof namedExport).toBe('function');
    });

    it('deve exportar hapticFeedback como default export', () => {
      const defaultExport = require('../haptic').default;
      expect(defaultExport).toBeDefined();
      expect(typeof defaultExport).toBe('function');
    });

    it('default export e named export devem ser a mesma função', () => {
      const { hapticFeedback: namedExport, default: defaultExport } = require('../haptic');
      expect(defaultExport).toBe(namedExport);
    });
  });
});
