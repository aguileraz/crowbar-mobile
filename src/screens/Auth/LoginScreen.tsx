import React, { useEffect } from 'react';
import logger from '../../services/loggerService';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import {
  Button,
  Card,
  Title,
  Paragraph,
  Text,
  ActivityIndicator,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Redux
import { AppDispatch } from '../../store';
import {
  loginWithKeycloak,
  clearError,
  selectIsLoading,
  selectAuthError,
} from '../../store/slices/authSlice';

// Tema
import { theme, getSpacing, getBorderRadius } from '../../theme';

/**
 * Tela de Login
 * Interface de autenticação com Keycloak OAuth2/OIDC
 *
 * ⚠️ MIGRADO DE FIREBASE PARA KEYCLOAK
 * - Autenticação OAuth2 via browser
 * - Registro via Keycloak web console
 * - Reset de senha via Keycloak (não mais no app)
 */

// Tipos de navegação
type LoginScreenNavigationProp = NativeStackNavigationProp<any, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector(selectIsLoading);
  const authError = useSelector(selectAuthError);

  // Limpar erro quando componente monta
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Mostrar erro se houver
  useEffect(() => {
    if (authError) {
      Alert.alert('Erro de Autenticação', authError, [
        { text: 'OK', onPress: () => dispatch(clearError()) }
      ]);
    }
  }, [authError, dispatch]);

  /**
   * Fazer login com Keycloak OAuth2
   * Abre navegador para autenticação
   */
  const handleLogin = async () => {
    try {
      logger.info('Iniciando login OAuth2...');
      await dispatch(loginWithKeycloak()).unwrap();
      logger.info('Login realizado com sucesso');
      // Navegação será tratada pelo AuthNavigator
    } catch (error: any) {
      logger.error('Login falhou:', error);
      // Erro já tratado pelo slice e exibido no Alert acima
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        {/* Header com Logo */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Title style={styles.title}>Bem-vindo ao Crowbar</Title>
          <Paragraph style={styles.subtitle}>
            Marketplace de caixas misteriosas
          </Paragraph>
        </View>

        {/* Card de Login */}
        <Card style={styles.card}>
          <Card.Content>
            {/* Informações sobre o novo sistema */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                🔐 Login seguro via Keycloak
              </Text>
              <Text style={styles.infoSubtext}>
                Autenticação OAuth2 com suporte a Multi-Factor Authentication (MFA)
              </Text>
            </View>

            {/* Botão de Login */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>
                  Autenticando...
                </Text>
              </View>
            ) : (
              <Button
                mode="contained"
                onPress={handleLogin}
                disabled={isLoading}
                style={styles.loginButton}
                contentStyle={styles.buttonContent}
                icon="login"
              >
                Fazer Login
              </Button>
            )}

            {/* Informações adicionais */}
            <View style={styles.helpContainer}>
              <Text style={styles.helpText}>
                • Não possui conta? O registro será feito no primeiro acesso
              </Text>
              <Text style={styles.helpText}>
                • Esqueceu a senha? Use "Recuperar senha" na tela de login do navegador
              </Text>
              <Text style={styles.helpText}>
                • MFA disponível para maior segurança
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Ao fazer login, você concorda com nossos{'\n'}
            Termos de Uso e Política de Privacidade
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: getSpacing(3),
  },
  header: {
    alignItems: 'center',
    marginTop: getSpacing(6),
    marginBottom: getSpacing(4),
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: getSpacing(2),
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: getSpacing(1),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  card: {
    borderRadius: getBorderRadius('large'),
    elevation: 4,
  },
  infoContainer: {
    backgroundColor: theme.colors.primaryContainer,
    padding: getSpacing(2),
    borderRadius: getBorderRadius('medium'),
    marginBottom: getSpacing(3),
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onPrimaryContainer,
    marginBottom: getSpacing(0.5),
  },
  infoSubtext: {
    fontSize: 13,
    color: theme.colors.onPrimaryContainer,
    opacity: 0.8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: getSpacing(3),
  },
  loadingText: {
    marginTop: getSpacing(2),
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  loginButton: {
    marginBottom: getSpacing(3),
    borderRadius: getBorderRadius('medium'),
  },
  buttonContent: {
    paddingVertical: getSpacing(1),
  },
  helpContainer: {
    marginTop: getSpacing(2),
    padding: getSpacing(2),
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: getBorderRadius('small'),
  },
  helpText: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    marginBottom: getSpacing(1),
    lineHeight: 20,
  },
  footer: {
    marginTop: getSpacing(4),
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LoginScreen;
