import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Button,
  Card,
  Title,
  Paragraph,
  Text,
  ActivityIndicator,
  Switch,
  Divider,
  List,
} from 'react-native-paper';
import { useSelector } from 'react-redux';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Services
import mfaService, { MFAStatus } from '../../services/mfaService';
import logger from '../../services/loggerService';

// Redux
import { selectUser } from '../../store/slices/authSlice';

// Navigation
import { RootStackParamList } from '../../navigation/AppNavigator';

// Tema
import { theme, getSpacing, getBorderRadius } from '../../theme';

/**
 * Tela de Configuração MFA (Multi-Factor Authentication)
 * Permite habilitar/desabilitar MFA via Keycloak
 */

type MFASetupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MFASetup'>;

interface MFASetupScreenProps {
  navigation: MFASetupScreenNavigationProp;
}

const MFASetupScreen: React.FC<MFASetupScreenProps> = ({ navigation }) => {
  const user = useSelector(selectUser);
  
  const [mfaStatus, setMfaStatus] = useState<MFAStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnabling, setIsEnabling] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

  // Carregar status MFA ao montar componente
  useEffect(() => {
    loadMFAStatus();
  }, []);

  /**
   * Carregar status MFA do backend
   */
  const loadMFAStatus = async () => {
    try {
      setIsLoading(true);
      const status = await mfaService.getStatus();
      setMfaStatus(status);
      logger.info('Status MFA carregado', { mfaEnabled: status.mfaEnabled });
    } catch (error: any) {
      logger.error('Erro ao carregar status MFA:', error);
      Alert.alert(
        'Erro',
        'Não foi possível carregar o status do MFA. Tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Habilitar MFA
   */
  const handleEnableMFA = async () => {
    try {
      setIsEnabling(true);
      
      const result = await mfaService.enable();
      
      Alert.alert(
        'MFA Habilitado',
        result.message + '\n\n' + result.nextAction,
        [
          {
            text: 'OK',
            onPress: () => {
              // Recarregar status
              loadMFAStatus();
              // Navegar de volta ou mostrar instruções
              navigation.goBack();
            },
          },
        ]
      );
      
      logger.info('MFA habilitado com sucesso');
    } catch (error: any) {
      logger.error('Erro ao habilitar MFA:', error);
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível habilitar o MFA. Tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsEnabling(false);
    }
  };

  /**
   * Desabilitar MFA
   */
  const handleDisableMFA = async () => {
    if (!mfaStatus || !mfaStatus.credentials.length) {
      Alert.alert('Erro', 'Nenhuma credencial MFA encontrada.');
      return;
    }

    Alert.alert(
      'Confirmar Desabilitação',
      'Tem certeza que deseja desabilitar o MFA? Isso reduzirá a segurança da sua conta.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desabilitar',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDisabling(true);
              
              // Desabilitar primeira credencial (geralmente só há uma)
              const credentialId = mfaStatus.credentials[0].id;
              const result = await mfaService.disable(credentialId);
              
              Alert.alert('MFA Desabilitado', result.message, [
                {
                  text: 'OK',
                  onPress: () => {
                    loadMFAStatus();
                  },
                },
              ]);
              
              logger.info('MFA desabilitado com sucesso');
            } catch (error: any) {
              logger.error('Erro ao desabilitar MFA:', error);
              Alert.alert(
                'Erro',
                error.message || 'Não foi possível desabilitar o MFA. Tente novamente.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsDisabling(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  const mfaEnabled = mfaStatus?.mfaEnabled || false;
  const credentials = mfaStatus?.credentials || [];

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Title style={styles.title}>Autenticação de Dois Fatores (MFA)</Title>
          <Paragraph style={styles.subtitle}>
            Adicione uma camada extra de segurança à sua conta
          </Paragraph>
        </View>

        {/* Status Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.statusContainer}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Status:</Text>
                <View style={styles.statusBadge}>
                  <Text
                    style={[
                      styles.statusText,
                      mfaEnabled ? styles.statusEnabled : styles.statusDisabled,
                    ]}
                  >
                    {mfaEnabled ? '✅ Habilitado' : '❌ Desabilitado'}
                  </Text>
                </View>
              </View>
              
              {mfaEnabled && credentials.length > 0 && (
                <View style={styles.credentialsContainer}>
                  <Text style={styles.credentialsLabel}>
                    Credenciais configuradas: {credentials.length}
                  </Text>
                  {credentials.map((cred, index) => (
                    <View key={cred.id} style={styles.credentialItem}>
                      <Text style={styles.credentialText}>
                        {cred.userLabel || `Credencial ${index + 1}`}
                      </Text>
                      <Text style={styles.credentialType}>
                        Tipo: {cred.type}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Instructions Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Como funciona?</Title>
            <Paragraph style={styles.instructionText}>
              • O MFA adiciona uma segunda camada de segurança ao seu login
            </Paragraph>
            <Paragraph style={styles.instructionText}>
              • Após habilitar, você precisará fornecer um código adicional ao fazer login
            </Paragraph>
            <Paragraph style={styles.instructionText}>
              • Use um aplicativo autenticador (Google Authenticator, Authy, etc.)
            </Paragraph>
            <Paragraph style={styles.instructionText}>
              • O código muda a cada 30 segundos para maior segurança
            </Paragraph>
          </Card.Content>
        </Card>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {!mfaEnabled ? (
            <Button
              mode="contained"
              onPress={handleEnableMFA}
              disabled={isEnabling}
              style={styles.actionButton}
              contentStyle={styles.buttonContent}
              icon="shield-check"
            >
              {isEnabling ? 'Habilitando...' : 'Habilitar MFA'}
            </Button>
          ) : (
            <Button
              mode="outlined"
              onPress={handleDisableMFA}
              disabled={isDisabling}
              style={[styles.actionButton, styles.disableButton]}
              contentStyle={styles.buttonContent}
              icon="shield-off"
              textColor={theme.colors.error}
            >
              {isDisabling ? 'Desabilitando...' : 'Desabilitar MFA'}
            </Button>
          )}
        </View>

        {/* Security Notice */}
        <Card style={[styles.card, styles.securityCard]}>
          <Card.Content>
            <Text style={styles.securityTitle}>🔒 Importante</Text>
            <Text style={styles.securityText}>
              Mantenha seus códigos de backup em local seguro. Se você perder acesso ao seu dispositivo autenticador, precisará usar os códigos de backup para recuperar sua conta.
            </Text>
          </Card.Content>
        </Card>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: getSpacing(2),
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  header: {
    marginBottom: getSpacing(4),
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: getSpacing(1),
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  card: {
    borderRadius: getBorderRadius('large'),
    elevation: 2,
    marginBottom: getSpacing(3),
  },
  statusContainer: {
    paddingVertical: getSpacing(1),
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing(2),
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  statusBadge: {
    paddingHorizontal: getSpacing(2),
    paddingVertical: getSpacing(0.5),
    borderRadius: getBorderRadius('small'),
    backgroundColor: theme.colors.surfaceVariant,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusEnabled: {
    color: theme.colors.primary,
  },
  statusDisabled: {
    color: theme.colors.error,
  },
  credentialsContainer: {
    marginTop: getSpacing(2),
    paddingTop: getSpacing(2),
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  credentialsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: getSpacing(1),
  },
  credentialItem: {
    paddingVertical: getSpacing(1),
  },
  credentialText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  credentialType: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: getSpacing(0.5),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: getSpacing(2),
  },
  instructionText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    marginBottom: getSpacing(1),
    lineHeight: 20,
  },
  actionsContainer: {
    marginBottom: getSpacing(3),
  },
  actionButton: {
    borderRadius: getBorderRadius('medium'),
    marginBottom: getSpacing(2),
  },
  disableButton: {
    borderColor: theme.colors.error,
  },
  buttonContent: {
    paddingVertical: getSpacing(1),
  },
  securityCard: {
    backgroundColor: theme.colors.errorContainer,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onErrorContainer,
    marginBottom: getSpacing(1),
  },
  securityText: {
    fontSize: 13,
    color: theme.colors.onErrorContainer,
    lineHeight: 18,
  },
});

export default MFASetupScreen;

