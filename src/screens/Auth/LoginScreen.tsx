import React, { useState, useEffect } from 'react';
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
  Divider,
  HelperText,
} from 'react-native-paper';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Redux
import { AppDispatch } from '../../store';
import {
  loginWithEmail,
  resetPassword,
  clearError,
  selectIsLoading,
  selectAuthError,
} from '../../store/slices/authSlice';

// Tema
import { theme, getSpacing, getBorderRadius } from '../../theme';

/**
 * Tela de Login
 * Interface de autenticação com Firebase Auth
 */

// Tipos de navegação
type LoginScreenNavigationProp = NativeStackNavigationProp<any, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

// Schema de validação com Yup
const loginValidationSchema = Yup.object().shape({
  email: Yup.string()
    .email('Email inválido')
    .required('Email é obrigatório'),
  password: Yup.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .required('Senha é obrigatória'),
});

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector(selectIsLoading);
  const authError = useSelector(selectAuthError);
  
  const [showPassword, setShowPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);

  // Formik para gerenciamento do formulário
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: loginValidationSchema,
    onSubmit: async (values) => {
      if (isResetMode) {
        handlePasswordReset(values.email);
      } else {
        handleLogin(values);
      }
    },
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
   * Fazer login
   */
  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      await dispatch(loginWithEmail(values)).unwrap();
      // Navegação será tratada pelo AuthNavigator
    } catch (error) {
      // Erro já tratado pelo slice
      console.error('Login failed:', error);
    }
  };

  /**
   * Reset de senha
   */
  const handlePasswordReset = async (email: string) => {
    if (!email) {
      Alert.alert('Erro', 'Digite seu email para recuperar a senha');
      return;
    }

    try {
      await dispatch(resetPassword(email)).unwrap();
      Alert.alert(
        'Email Enviado',
        'Verifique sua caixa de entrada para redefinir sua senha',
        [
          {
            text: 'OK',
            onPress: () => setIsResetMode(false),
          },
        ]
      );
    } catch (error) {
      // Erro já tratado pelo slice
      console.error('Password reset failed:', error);
    }
  };

  /**
   * Navegar para tela de registro
   */
  const navigateToRegister = () => {
    navigation.navigate('Register');
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
            <Title style={styles.title}>
              {isResetMode ? 'Recuperar Senha' : 'Bem-vindo'}
            </Title>
            <Paragraph style={styles.subtitle}>
              {isResetMode
                ? 'Digite seu email para receber instruções de recuperação'
                : 'Faça login para acessar o Crowbar Mobile'
              }
            </Paragraph>
          </View>

          {/* Formulário */}
          <Card style={styles.card}>
            <Card.Content>
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

              {/* Senha (apenas se não estiver em modo reset) */}
              {!isResetMode && (
                <>
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
                </>
              )}

              {/* Botão principal */}
              <Button
                mode="contained"
                onPress={() => formik.handleSubmit()}
                loading={isLoading}
                disabled={isLoading || !formik.isValid}
                style={styles.primaryButton}
                contentStyle={styles.buttonContent}
              >
                {isResetMode ? 'Enviar Email' : 'Entrar'}
              </Button>

              {/* Divider */}
              <Divider style={styles.divider} />

              {/* Botões secundários */}
              {!isResetMode ? (
                <>
                  <Button
                    mode="text"
                    onPress={() => setIsResetMode(true)}
                    disabled={isLoading}
                    style={styles.textButton}
                  >
                    Esqueci minha senha
                  </Button>

                  <Button
                    mode="outlined"
                    onPress={navigateToRegister}
                    disabled={isLoading}
                    style={styles.outlinedButton}
                    contentStyle={styles.buttonContent}
                  >
                    Criar conta
                  </Button>
                </>
              ) : (
                <Button
                  mode="text"
                  onPress={() => setIsResetMode(false)}
                  disabled={isLoading}
                  style={styles.textButton}
                >
                  Voltar ao login
                </Button>
              )}
            </Card.Content>
          </Card>

          {/* Footer */}
          <View style={styles.footer}>
            <Paragraph style={styles.footerText}>
              Ao continuar, você concorda com nossos{'\n'}
              Termos de Uso e Política de Privacidade
            </Paragraph>
          </View>
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
  primaryButton: {
    marginTop: getSpacing('md'),
    borderRadius: getBorderRadius('md'),
  },
  outlinedButton: {
    marginTop: getSpacing('sm'),
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
  footer: {
    alignItems: 'center',
    marginTop: getSpacing('xl'),
  },
  footerText: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
});

export default LoginScreen;
