import React, { useState } from 'react';
import logger from '../../services/loggerService';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,

  HelperText,
  Checkbox,
  Divider,
} from 'react-native-paper';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Redux
import { AppDispatch } from '../../store';
import {
  registerWithEmail,
  clearError,
  selectIsLoading,
  selectAuthError,
} from '../../store/slices/authSlice';

// Tema
import { theme, getSpacing, getBorderRadius } from '../../theme';

/**
 * Tela de Registro
 * Interface para criação de nova conta com Firebase Auth
 */

// Tipos de navegação
type RegisterScreenNavigationProp = NativeStackNavigationProp<any, 'Register'>;

interface RegisterScreenProps {
  navigation: RegisterScreenNavigationProp;
}

// Schema de validação com Yup
const registerValidationSchema = Yup.object().shape({
  displayName: Yup.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .required('Nome é obrigatório'),
  email: Yup.string()
    .email('Email inválido')
    .required('Email é obrigatório'),
  password: Yup.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'
    )
    .required('Senha é obrigatória'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Senhas não coincidem')
    .required('Confirmação de senha é obrigatória'),
  acceptTerms: Yup.boolean()
    .oneOf([true], 'Você deve aceitar os termos de uso')
    .required('Você deve aceitar os termos de uso'),
});

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector(selectIsLoading);
  const authError = useSelector(selectAuthError);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Formik para gerenciamento do formulário
  const formik = useFormik({
    initialValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
    validationSchema: registerValidationSchema,
    onSubmit: handleRegister,
  });

  // Limpar erro quando componente monta
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Mostrar erro se houver
  useEffect(() => {
    if (authError) {
      Alert.alert('Erro', authError, [
        { text: 'OK', onPress: () => dispatch(clearError()) }
      ]);
    }
  }, [authError, dispatch]);

  /**
   * Fazer registro
   */
  async function handleRegister(values: {
    displayName: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
  }) {
    try {
      await dispatch(registerWithEmail({
        email: values.email,
        password: values.password,
        displayName: values.displayName,
      })).unwrap();
      
      // Mostrar sucesso
      Alert.alert(
        'Conta Criada',
        'Sua conta foi criada com sucesso! Bem-vindo ao Crowbar Mobile.',
        [{ text: 'OK' }]
      );
      
      // Navegação será tratada pelo AuthNavigator
    } catch (error) {
      // Erro já tratado pelo slice
      logger.error('Registration failed:', error);
    }
  }

  /**
   * Navegar para tela de login
   */
  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Title style={styles.title}>Criar Conta</Title>
            <Paragraph style={styles.subtitle}>
              Junte-se ao Crowbar Mobile e descubra caixas misteriosas incríveis
            </Paragraph>
          </View>

          {/* Formulário */}
          <Card style={styles.card}>
            <Card.Content>
              {/* Nome */}
              <TextInput
                label="Nome completo"
                value={formik.values.displayName}
                onChangeText={formik.handleChange('displayName')}
                onBlur={formik.handleBlur('displayName')}
                error={formik.touched.displayName && !!formik.errors.displayName}
                autoCapitalize="words"
                autoComplete="name"
                style={styles.input}
                disabled={isLoading}
              />
              <HelperText
                type="error"
                visible={formik.touched.displayName && !!formik.errors.displayName}
              >
                {formik.errors.displayName}
              </HelperText>

              {/* Email */}
              <TextInput
                label="Email"
                value={formik.values.email}
                onChangeText={formik.handleChange('email')}
                onBlur={formik.handleBlur('email')}
                error={formik.touched.email && !!formik.errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.input}
                disabled={isLoading}
              />
              <HelperText
                type="error"
                visible={formik.touched.email && !!formik.errors.email}
              >
                {formik.errors.email}
              </HelperText>

              {/* Senha */}
              <TextInput
                label="Senha"
                value={formik.values.password}
                onChangeText={formik.handleChange('password')}
                onBlur={formik.handleBlur('password')}
                error={formik.touched.password && !!formik.errors.password}
                secureTextEntry={!showPassword}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                style={styles.input}
                disabled={isLoading}
              />
              <HelperText
                type="error"
                visible={formik.touched.password && !!formik.errors.password}
              >
                {formik.errors.password}
              </HelperText>

              {/* Confirmar Senha */}
              <TextInput
                label="Confirmar senha"
                value={formik.values.confirmPassword}
                onChangeText={formik.handleChange('confirmPassword')}
                onBlur={formik.handleBlur('confirmPassword')}
                error={formik.touched.confirmPassword && !!formik.errors.confirmPassword}
                secureTextEntry={!showConfirmPassword}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
                style={styles.input}
                disabled={isLoading}
              />
              <HelperText
                type="error"
                visible={formik.touched.confirmPassword && !!formik.errors.confirmPassword}
              >
                {formik.errors.confirmPassword}
              </HelperText>

              {/* Termos de uso */}
              <View style={styles.checkboxContainer}>
                <Checkbox
                  status={formik.values.acceptTerms ? 'checked' : 'unchecked'}
                  onPress={() => formik.setFieldValue('acceptTerms', !formik.values.acceptTerms)}
                  disabled={isLoading}
                />
                <Text style={styles.checkboxText}>
                  Eu aceito os{' '}
                  <Text style={styles.linkText}>Termos de Uso</Text>
                  {' '}e{' '}
                  <Text style={styles.linkText}>Política de Privacidade</Text>
                </Text>
              </View>
              <HelperText
                type="error"
                visible={formik.touched.acceptTerms && !!formik.errors.acceptTerms}
              >
                {formik.errors.acceptTerms}
              </HelperText>

              {/* Botão de registro */}
              <Button
                mode="contained"
                onPress={() => formik.handleSubmit()}
                loading={isLoading}
                disabled={isLoading || !formik.isValid}
                style={styles.primaryButton}
                contentStyle={styles.buttonContent}
              >
                Criar Conta
              </Button>

              {/* Divider */}
              <Divider style={styles.divider} />

              {/* Botão para login */}
              <Button
                mode="text"
                onPress={navigateToLogin}
                disabled={isLoading}
                style={styles.textButton}
              >
                Já tem uma conta? Faça login
              </Button>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: getSpacing('lg'),
  },
  header: {
    alignItems: 'center',
    marginBottom: getSpacing('xl'),
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: getSpacing('sm'),
  },
  subtitle: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    fontSize: 16,
  },
  card: {
    elevation: 4,
    borderRadius: getBorderRadius('lg'),
  },
  input: {
    marginBottom: getSpacing('xs'),
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: getSpacing('md'),
    marginBottom: getSpacing('xs'),
  },
  checkboxText: {
    flex: 1,
    marginLeft: getSpacing('sm'),
    color: theme.colors.onSurface,
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  primaryButton: {
    marginTop: getSpacing('md'),
    borderRadius: getBorderRadius('md'),
  },
  textButton: {
    marginTop: getSpacing('sm'),
  },
  buttonContent: {
    paddingVertical: getSpacing('xs'),
  },
  divider: {
    marginVertical: getSpacing('lg'),
  },
});

export default RegisterScreen;
