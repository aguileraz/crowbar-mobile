import React, { useState } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  RadioButton,
  HelperText,
} from 'react-native-paper';
import { theme, getSpacing } from '../theme';

/**
 * Componente de Calculadora de Frete
 * Permite calcular e selecionar opções de frete
 */

interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimated_days: number;
  description?: string;
}

interface ShippingCalculatorProps {
  onCalculate: (zipCode: string) => Promise<void>;
  options: ShippingOption[];
  selectedOption: string | null;
  onSelectOption: (optionId: string) => void;
  disabled?: boolean;
}

const ShippingCalculator: React.FC<ShippingCalculatorProps> = ({
  onCalculate,
  options,
  selectedOption,
  onSelectOption,
  disabled = false,
}) => {
  const [zipCode, setZipCode] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState('');

  /**
   * Calcular frete
   */
  const handleCalculate = async () => {
    if (!zipCode.trim()) {
      setError('Digite um CEP válido');
      return;
    }

    // Validar formato do CEP
    const cleanZip = zipCode.replace(/\D/g, '');
    if (cleanZip.length !== 8) {
      setError('CEP deve ter 8 dígitos');
      return;
    }

    setIsCalculating(true);
    setError('');

    try {
      await onCalculate(cleanZip);
    } catch (err: any) {
      setError(err.message || 'Erro ao calcular frete');
    } finally {
      setIsCalculating(false);
    }
  };

  /**
   * Formatar CEP
   */
  const formatZipCode = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
    return formatted;
  };

  /**
   * Limpar erro quando CEP muda
   */
  const handleZipCodeChange = (text: string) => {
    const formatted = formatZipCode(text);
    setZipCode(formatted);
    if (error) {
      setError('');
    }
  };

  /**
   * Formatar preço
   */
  const formatPrice = (price: number): string => {
    if (price === 0) return 'Grátis';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  /**
   * Formatar prazo
   */
  const formatDeliveryTime = (days: number): string => {
    if (days === 1) return '1 dia útil';
    return `${days} dias úteis`;
  };

  return (
    <View style={styles.container}>
      {/* Input de CEP */}
      <View style={styles.inputContainer}>
        <TextInput
          label="CEP"
          value={zipCode}
          onChangeText={handleZipCodeChange}
          placeholder="00000-000"
          keyboardType="numeric"
          maxLength={9}
          disabled={disabled || isCalculating}
          error={!!error}
          style={styles.input}
          mode="outlined"
          dense
        />
        <Button
          mode="contained"
          onPress={handleCalculate}
          loading={isCalculating}
          disabled={disabled || isCalculating || !zipCode.trim()}
          style={styles.button}
          compact
        >
          Calcular
        </Button>
      </View>

      {error && (
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
      )}

      {/* Opções de frete */}
      {options.length > 0 && (
        <View style={styles.optionsContainer}>
          <Text style={styles.optionsTitle}>Opções de entrega:</Text>
          
          {options.map((option) => (
            <View key={option.id} style={styles.optionItem}>
              <RadioButton
                value={option.id}
                status={selectedOption === option.id ? 'checked' : 'unchecked'}
                onPress={() => onSelectOption(option.id)}
                disabled={disabled}
              />
              
              <View style={styles.optionInfo}>
                <View style={styles.optionHeader}>
                  <Text style={styles.optionName}>{option.name}</Text>
                  <Text style={styles.optionPrice}>
                    {formatPrice(option.price)}
                  </Text>
                </View>
                
                <Text style={styles.optionDelivery}>
                  Entrega em {formatDeliveryTime(option.estimated_days)}
                </Text>
                
                {option.description && (
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: getSpacing('sm'),
    marginBottom: getSpacing('md'),
  },
  input: {
    flex: 1,
  },
  button: {
    marginTop: getSpacing('xs'),
  },
  optionsContainer: {
    marginTop: getSpacing('md'),
  },
  optionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: getSpacing('sm'),
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: getSpacing('sm'),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  optionInfo: {
    flex: 1,
    marginLeft: getSpacing('sm'),
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing('xs'),
  },
  optionName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  optionPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  optionDelivery: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: getSpacing('xs'),
  },
  optionDescription: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
});

export default ShippingCalculator;