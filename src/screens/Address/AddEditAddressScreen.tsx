import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  IconButton,
  Title,
  Switch,
  SegmentedButtons,
  ActivityIndicator,
} from 'react-native-paper';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

// Services
import { userService } from '../../services/userService';
import { viaCepService } from '../../services/viaCepService';

// Types
import { Address } from '../../types/api';

// Theme
import { _theme, getSpacing, getBorderRadius } from '../../theme';

/**
 * Tela de Adicionar/Editar Endereço
 * Formulário completo com validação de CEP
 */

type AddEditAddressScreenNavigationProp = NativeStackNavigationProp<any, 'AddEditAddress'>;
type AddEditAddressScreenRouteProp = RouteProp<{
  AddEditAddress: { mode: 'add' | 'edit'; address?: Address };
}, 'AddEditAddress'>;

interface AddEditAddressScreenProps {
  navigation: AddEditAddressScreenNavigationProp;
  route: AddEditAddressScreenRouteProp;
}

// Validation schema
const addressSchema = Yup.object().shape({
  label: Yup.string().required('Nome do endereço é obrigatório'),
  zip_code: Yup.string()
    .matches(/^\d{5}-?\d{3}$/, 'CEP deve ter 8 dígitos')
    .required('CEP é obrigatório'),
  street: Yup.string().required('Rua é obrigatória'),
  number: Yup.string().required('Número é obrigatório'),
  neighborhood: Yup.string().required('Bairro é obrigatório'),
  city: Yup.string().required('Cidade é obrigatória'),
  state: Yup.string().required('Estado é obrigatório'),
});

const AddEditAddressScreen: React.FC<AddEditAddressScreenProps> = ({
  navigation,
  route,
}) => {
  const { mode, address } = route.params;
  const isEditing = mode === 'edit';
  
  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  // Form handling
  const formik = useFormik({
    initialValues: {
      label: address?.label || '',
      type: address?.type || 'home',
      zip_code: address?.zip_code || '',
      street: address?.street || '',
      number: address?.number || '',
      complement: address?.complement || '',
      neighborhood: address?.neighborhood || '',
      city: address?.city || '',
      state: address?.state || '',
      reference: address?.reference || '',
      is_default: address?.is_default || false,
    },
    validationSchema: addressSchema,
    onSubmit: handleSubmit,
  });

  /**
   * Handle form submission
   */
  async function handleSubmit(values: any) {
    setIsLoading(true);
    
    try {
      if (isEditing && address) {
        await userService.updateAddress(address.id, _values);
        Alert.alert('Sucesso', 'Endereço atualizado com sucesso!');
      } else {
        await userService.createAddress(values);
        Alert.alert('Sucesso', 'Endereço adicionado com sucesso!');
      }
      
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao salvar endereço');
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Handle CEP lookup
   */
  const handleCepLookup = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length === 8) {
      setIsLoadingCep(true);
      
      try {
        const addressData = await viaCepService.getAddressByCep(cleanCep);
        
        if (addressData.erro) {
          Alert.alert('Erro', 'CEP não encontrado');
          return;
        }
        
        // Auto-fill address fields
        formik.setFieldValue('street', addressData.logradouro);
        formik.setFieldValue('neighborhood', addressData.bairro);
        formik.setFieldValue('city', addressData.localidade);
        formik.setFieldValue('state', addressData.uf);
        
        Alert.alert('Sucesso', 'Endereço preenchido automaticamente!');
      } catch (error) {
        Alert.alert('Erro', 'Erro ao buscar CEP');
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  /**
   * Format CEP input
   */
  const formatCep = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
    return formatted;
  };

  /**
   * Handle CEP change
   */
  const handleCepChange = (text: string) => {
    const formatted = formatCep(text);
    formik.setFieldValue('zip_code', _formatted);
    
    // Auto-lookup when CEP is complete
    if (formatted.length === 9) {
      handleCepLookup(formatted);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Title style={styles.headerTitle}>
          {isEditing ? 'Editar Endereço' : 'Adicionar Endereço'}
        </Title>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Address Label */}
          <TextInput
            label="Nome do endereço *"
            value={formik.values.label}
            onChangeText={formik.handleChange('label')}
            onBlur={formik.handleBlur('label')}
            error={formik.touched.label && !!formik.errors.label}
            style={styles.input}
            mode="outlined"
            placeholder="Ex: Casa, Trabalho, Casa da Mãe"
          />
          {formik.touched.label && formik.errors.label && (
            <Text style={styles.errorText}>{formik.errors.label}</Text>
          )}

          {/* Address Type */}
          <Text style={styles.sectionLabel}>Tipo de endereço</Text>
          <SegmentedButtons
            value={formik.values.type}
            onValueChange={(value) => formik.setFieldValue('type', value)}
            buttons={[
              { value: 'home', label: 'Casa', icon: 'home' },
              { value: 'work', label: 'Trabalho', icon: 'office-building' },
              { value: 'other', label: 'Outro', icon: 'map-marker' },
            ]}
            style={styles.segmentedButtons}
          />

          {/* CEP */}
          <View style={styles.cepContainer}>
            <TextInput
              label="CEP *"
              value={formik.values.zip_code}
              onChangeText={handleCepChange}
              onBlur={formik.handleBlur('zip_code')}
              error={formik.touched.zip_code && !!formik.errors.zip_code}
              style={styles.cepInput}
              mode="outlined"
              keyboardType="numeric"
              maxLength={9}
              placeholder="00000-000"
            />
            {isLoadingCep && (
              <ActivityIndicator
                size="small"
                style={styles.cepLoader}
                color={theme.colors.primary}
              />
            )}
          </View>
          {formik.touched.zip_code && formik.errors.zip_code && (
            <Text style={styles.errorText}>{formik.errors.zip_code}</Text>
          )}

          {/* Street */}
          <TextInput
            label="Rua *"
            value={formik.values.street}
            onChangeText={formik.handleChange('street')}
            onBlur={formik.handleBlur('street')}
            error={formik.touched.street && !!formik.errors.street}
            style={styles.input}
            mode="outlined"
          />
          {formik.touched.street && formik.errors.street && (
            <Text style={styles.errorText}>{formik.errors.street}</Text>
          )}

          {/* Number and Complement */}
          <View style={styles.row}>
            <TextInput
              label="Número *"
              value={formik.values.number}
              onChangeText={formik.handleChange('number')}
              onBlur={formik.handleBlur('number')}
              error={formik.touched.number && !!formik.errors.number}
              style={styles.numberInput}
              mode="outlined"
              keyboardType="numeric"
            />
            <TextInput
              label="Complemento"
              value={formik.values.complement}
              onChangeText={formik.handleChange('complement')}
              onBlur={formik.handleBlur('complement')}
              style={styles.complementInput}
              mode="outlined"
              placeholder="Apto, Bloco, etc."
            />
          </View>
          {formik.touched.number && formik.errors.number && (
            <Text style={styles.errorText}>{formik.errors.number}</Text>
          )}

          {/* Neighborhood */}
          <TextInput
            label="Bairro *"
            value={formik.values.neighborhood}
            onChangeText={formik.handleChange('neighborhood')}
            onBlur={formik.handleBlur('neighborhood')}
            error={formik.touched.neighborhood && !!formik.errors.neighborhood}
            style={styles.input}
            mode="outlined"
          />
          {formik.touched.neighborhood && formik.errors.neighborhood && (
            <Text style={styles.errorText}>{formik.errors.neighborhood}</Text>
          )}

          {/* City and State */}
          <View style={styles.row}>
            <TextInput
              label="Cidade *"
              value={formik.values.city}
              onChangeText={formik.handleChange('city')}
              onBlur={formik.handleBlur('city')}
              error={formik.touched.city && !!formik.errors.city}
              style={styles.cityInput}
              mode="outlined"
            />
            <TextInput
              label="Estado *"
              value={formik.values.state}
              onChangeText={formik.handleChange('state')}
              onBlur={formik.handleBlur('state')}
              error={formik.touched.state && !!formik.errors.state}
              style={styles.stateInput}
              mode="outlined"
              maxLength={2}
              placeholder="SP"
            />
          </View>
          {((formik.touched.city && formik.errors.city) || 
            (formik.touched.state && formik.errors.state)) && (
            <Text style={styles.errorText}>
              {formik.errors.city || formik.errors.state}
            </Text>
          )}

          {/* Reference */}
          <TextInput
            label="Ponto de referência"
            value={formik.values.reference}
            onChangeText={formik.handleChange('reference')}
            onBlur={formik.handleBlur('reference')}
            style={styles.input}
            mode="outlined"
            placeholder="Ex: Próximo ao shopping"
            multiline
            numberOfLines={2}
          />

          {/* Default Address Switch */}
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Definir como endereço padrão</Text>
            <Switch
              value={formik.values.is_default}
              onValueChange={(value) => formik.setFieldValue('is_default', value)}
            />
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={formik.handleSubmit}
          loading={isLoading}
          disabled={isLoading || !formik.isValid}
          style={styles.saveButton}
          contentStyle={styles.saveButtonContent}
        >
          {isEditing ? 'Atualizar Endereço' : 'Salvar Endereço'}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getSpacing('md'),
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: getSpacing('md'),
  },
  input: {
    marginBottom: getSpacing('md'),
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: getSpacing('sm'),
    marginTop: getSpacing('md'),
  },
  segmentedButtons: {
    marginBottom: getSpacing('lg'),
  },
  cepContainer: {
    position: 'relative',
    marginBottom: getSpacing('md'),
  },
  cepInput: {
    flex: 1,
  },
  cepLoader: {
    position: 'absolute',
    right: 12,
    top: 20,
  },
  row: {
    flexDirection: 'row',
    gap: getSpacing('md'),
    marginBottom: getSpacing('md'),
  },
  numberInput: {
    flex: 1,
  },
  complementInput: {
    flex: 2,
  },
  cityInput: {
    flex: 2,
  },
  stateInput: {
    flex: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: getSpacing('lg'),
    marginBottom: getSpacing('md'),
  },
  switchLabel: {
    fontSize: 16,
    color: theme.colors.onSurface,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: -getSpacing('sm'),
    marginBottom: getSpacing('sm'),
    marginLeft: getSpacing('md'),
  },
  footer: {
    padding: getSpacing('md'),
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  saveButton: {
    borderRadius: getBorderRadius('md'),
  },
  saveButtonContent: {
    paddingVertical: getSpacing('sm'),
  },
});

export default AddEditAddressScreen;
