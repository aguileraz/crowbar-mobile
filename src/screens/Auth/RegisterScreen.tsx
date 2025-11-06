import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import {
  Button,
  Card,
  Title,
  Paragraph,
  Text,
} from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Tema
import { theme, getSpacing, getBorderRadius } from '../../theme';

/**
 * Tela de Registro (DEPRECATED)
 *
 * ⚠️ REGISTRO MIGRADO PARA KEYCLOAK
 *
 * Agora o registro é feito automaticamente no primeiro login via Keycloak.
 * Esta tela apenas informa o usuário sobre a mudança e redireciona para LoginScreen.
 *
 * Fluxo novo:
 * 1. Usuário clica em "Fazer Login" na LoginScreen
 * 2. Browser abre com Keycloak
 * 3. Usuário escolhe "Criar conta" no Keycloak
 * 4. Após criar conta, retorna autenticado para o app
 */

// Tipos de navegação
type RegisterScreenNavigationProp = NativeStackNavigationProp<any, 'Register'>;

interface RegisterScreenProps {
  navigation: RegisterScreenNavigationProp;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Title style={styles.title}>Criar Nova Conta</Title>
          <Paragraph style={styles.subtitle}>
            Sistema de registro atualizado
          </Paragraph>
        </View>

        {/* Card Informativo */}
        <Card style={styles.card}>
          <Card.Content>
            {/* Info sobre nova abordagem */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoIcon}>🔐</Text>
              <Text style={styles.infoTitle}>
                Novo Sistema de Registro
              </Text>
              <Text style={styles.infoText}>
                Agora o registro é feito via Keycloak, nosso sistema seguro de autenticação.
              </Text>
            </View>

            {/* Como funciona */}
            <View style={styles.stepsContainer}>
              <Text style={styles.stepsTitle}>Como criar sua conta:</Text>

              <View style={styles.step}>
                <Text style={styles.stepNumber}>1</Text>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Clique em "Continuar para Login"</Text>
                  <Text style={styles.stepDescription}>
                    Você será levado para a tela de login
                  </Text>
                </View>
              </View>

              <View style={styles.step}>
                <Text style={styles.stepNumber}>2</Text>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Clique em "Fazer Login"</Text>
                  <Text style={styles.stepDescription}>
                    Um navegador seguro será aberto
                  </Text>
                </View>
              </View>

              <View style={styles.step}>
                <Text style={styles.stepNumber}>3</Text>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Escolha "Criar Conta"</Text>
                  <Text style={styles.stepDescription}>
                    Na tela do Keycloak, clique no link para criar sua conta
                  </Text>
                </View>
              </View>

              <View style={styles.step}>
                <Text style={styles.stepNumber}>4</Text>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Preencha seus dados</Text>
                  <Text style={styles.stepDescription}>
                    Email, senha e informações pessoais
                  </Text>
                </View>
              </View>

              <View style={styles.step}>
                <Text style={styles.stepNumber}>5</Text>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Pronto!</Text>
                  <Text style={styles.stepDescription}>
                    Você retornará ao app automaticamente autenticado
                  </Text>
                </View>
              </View>
            </View>

            {/* Benefícios */}
            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>Benefícios do novo sistema:</Text>
              <Text style={styles.benefitItem}>✓ Autenticação mais segura com OAuth2</Text>
              <Text style={styles.benefitItem}>✓ Suporte a MFA (Autenticação de 2 fatores)</Text>
              <Text style={styles.benefitItem}>✓ Recuperação de senha simplificada</Text>
              <Text style={styles.benefitItem}>✓ Login único (SSO) entre dispositivos</Text>
            </View>

            {/* Botão de ação */}
            <Button
              mode="contained"
              onPress={navigateToLogin}
              style={styles.primaryButton}
              contentStyle={styles.buttonContent}
              icon="arrow-right"
            >
              Continuar para Login
            </Button>
          </Card.Content>
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Problemas para criar conta?{'\n'}
            Entre em contato: suporte@crowbar.com.br
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
    marginTop: getSpacing(4),
    marginBottom: getSpacing(3),
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: getSpacing(2),
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: getSpacing(0.5),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  card: {
    borderRadius: getBorderRadius('large'),
    elevation: 4,
  },
  infoContainer: {
    backgroundColor: theme.colors.primaryContainer,
    padding: getSpacing(2.5),
    borderRadius: getBorderRadius('medium'),
    marginBottom: getSpacing(3),
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 48,
    marginBottom: getSpacing(1),
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onPrimaryContainer,
    marginBottom: getSpacing(1),
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.onPrimaryContainer,
    textAlign: 'center',
    opacity: 0.9,
  },
  stepsContainer: {
    marginBottom: getSpacing(3),
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: getSpacing(2),
  },
  step: {
    flexDirection: 'row',
    marginBottom: getSpacing(2),
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 32,
    marginRight: getSpacing(2),
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: getSpacing(0.5),
  },
  stepDescription: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
  benefitsContainer: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: getSpacing(2),
    borderRadius: getBorderRadius('small'),
    marginBottom: getSpacing(3),
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
    marginBottom: getSpacing(1),
  },
  benefitItem: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    marginBottom: getSpacing(0.5),
    lineHeight: 20,
  },
  primaryButton: {
    borderRadius: getBorderRadius('medium'),
  },
  buttonContent: {
    paddingVertical: getSpacing(1),
  },
  footer: {
    marginTop: getSpacing(3),
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default RegisterScreen;
