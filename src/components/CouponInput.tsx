import React, { useState } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import {
  TextInput,
  Button,
  HelperText,
} from 'react-native-paper';
import { theme, getSpacing } from '../theme';

/**
 * Componente de Input de Cupom
 * Permite inserir e aplicar cupons de desconto
 */

interface CouponInputProps {
  onApply: (code: string) => Promise<void>;
  disabled?: boolean;
}

const CouponInput: React.FC<CouponInputProps> = ({
  onApply,
  disabled = false,
}) => {
  const [code, setCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState('');

  /**
   * Aplicar cupom
   */
  const handleApply = async () => {
    if (!code.trim()) {
      setError('Digite um código de cupom');
      return;
    }

    setIsApplying(true);
    setError('');

    try {
      await onApply(code.trim().toUpperCase());
      setCode('');
    } catch (error: any) {
      setError(error.message || 'Cupom inválido');
    } finally {
      setIsApplying(false);
    }
  };

  /**
   * Limpar erro quando código muda
   */
  const handleCodeChange = (text: string) => {
    setCode(text);
    if (error) {
      setError('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          label="Código do cupom"
          value={code}
          onChangeText={handleCodeChange}
          placeholder="Ex: DESCONTO10"
          autoCapitalize="characters"
          autoCorrect={false}
          disabled={disabled || isApplying}
          error={!!error}
          style={styles.input}
          mode="outlined"
          dense
        />
        <Button
          mode="contained"
          onPress={handleApply}
          loading={isApplying}
          disabled={disabled || isApplying || !code.trim()}
          style={styles.button}
          compact
        >
          Aplicar
        </Button>
      </View>
      
      {error && (
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
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
  },
  input: {
    flex: 1,
  },
  button: {
    marginTop: getSpacing('xs'),
  },
});

export default CouponInput;
