import React, { useState } from 'react';
import logger from '../../services/loggerService';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Title,
  IconButton,
  Switch,
  List,

  Button,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { _useDispatch, useSelector } from 'react-redux';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Redux
import { AppDispatch } from '../../store';
import {
  fetchNotificationSettings,
  updateNotificationSettings,
  selectNotificationSettings,
  selectNotificationsUpdating,
  selectNotificationsError,
} from '../../store/slices/notificationsSlice';

// Services
import { notificationService } from '../../services/notificationService';

// Components
import ErrorMessage from '../../components/ErrorMessage';

// Types
import { NotificationSettings } from '../../types/api';

// Theme
import { _theme, getSpacing } from '../../theme';

/**
 * Tela de Configurações de Notificação
 * Permite configurar preferências de notificação
 */

type NotificationSettingsScreenNavigationProp = NativeStackNavigationProp<any, 'NotificationSettings'>;

interface NotificationSettingsScreenProps {
  navigation: NotificationSettingsScreenNavigationProp;
}

const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({
  navigation,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const settings = useSelector(selectNotificationSettings);
  const isUpdating = useSelector(selectNotificationsUpdating);
  const error = useSelector(selectNotificationsError);
  
  // Local state
  const [localSettings, setLocalSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Update local settings when Redux settings change
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  /**
   * Load notification settings
   */
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      await dispatch(fetchNotificationSettings()).unwrap();
    } catch (err) {
      logger.error('Error loading settings:', _err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update setting
   */
  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    if (!localSettings) return;

    const updatedSettings = { ...localSettings, [key]: value };
    setLocalSettings(updatedSettings);

    try {
      await dispatch(updateNotificationSettings({ [key]: value })).unwrap();
    } catch (err: any) {
      // Revert local change on error
      setLocalSettings(localSettings);
      Alert.alert('Erro', err.message || 'Erro ao atualizar configuração');
    }
  };

  /**
   * Send test notification
   */
  const sendTestNotification = async () => {
    try {
      await notificationService.sendTestNotification();
      Alert.alert('Sucesso', 'Notificação de teste enviada!');
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao enviar notificação de teste');
    }
  };

  /**
   * Render setting item
   */
  const renderSettingItem = (
    title: string,
    description: string,
    key: keyof NotificationSettings,
    icon: string
  ) => (
    <List.Item
      title={title}
      description={description}
      left={(props) => <List.Icon {...props} icon={icon} />}
      right={() => (
        <Switch
          value={localSettings?.[key] || false}
          onValueChange={(value) => updateSetting(key, value)}
          disabled={isUpdating}
        />
      )}
      style={styles.settingItem}
    />
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Carregando configurações...</Text>
      </View>
    );
  }

  if (error && !localSettings) {
    return (
      <ErrorMessage
        message={error}
        onRetry={loadSettings}
        style={styles.container}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Title style={styles.headerTitle}>
          Configurações de Notificação
        </Title>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Push Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificações Push</Text>
          <Text style={styles.sectionDescription}>
            Configure quais notificações você deseja receber
          </Text>
          
          {renderSettingItem(
            'Ativar notificações',
            'Receber notificações push no dispositivo',
            'push_enabled',
            'bell'
          )}
          
          <Divider style={styles.divider} />
          
          {renderSettingItem(
            'Atualizações de pedidos',
            'Notificações sobre status dos seus pedidos',
            'order_updates',
            'package-variant'
          )}
          
          {renderSettingItem(
            'Ofertas e promoções',
            'Notificações sobre ofertas especiais e promoções',
            'promotions',
            'tag'
          )}
          
          {renderSettingItem(
            'Novas caixas',
            'Notificações quando novas caixas estiverem disponíveis',
            'new_boxes',
            'gift'
          )}
          
          {renderSettingItem(
            'Lembretes de carrinho',
            'Lembrete sobre itens esquecidos no carrinho',
            'cart_reminders',
            'cart'
          )}
        </View>

        {/* Email Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificações por Email</Text>
          <Text style={styles.sectionDescription}>
            Configure notificações por email
          </Text>
          
          {renderSettingItem(
            'Emails promocionais',
            'Receber ofertas e novidades por email',
            'email_promotions',
            'email'
          )}
          
          {renderSettingItem(
            'Resumo semanal',
            'Receber resumo semanal de atividades',
            'weekly_summary',
            'email-newsletter'
          )}
          
          {renderSettingItem(
            'Confirmações de pedido',
            'Receber confirmações de pedido por email',
            'order_confirmations',
            'email-check'
          )}
        </View>

        {/* Sound & Vibration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Som e Vibração</Text>
          <Text style={styles.sectionDescription}>
            Configure alertas sonoros e vibração
          </Text>
          
          {renderSettingItem(
            'Som de notificação',
            'Reproduzir som ao receber notificações',
            'sound_enabled',
            'volume-high'
          )}
          
          {renderSettingItem(
            'Vibração',
            'Vibrar ao receber notificações',
            'vibration_enabled',
            'vibrate'
          )}
        </View>

        {/* Quiet Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horário Silencioso</Text>
          <Text style={styles.sectionDescription}>
            Não receber notificações durante determinados horários
          </Text>
          
          {renderSettingItem(
            'Ativar horário silencioso',
            'Silenciar notificações durante a noite',
            'quiet_hours_enabled',
            'sleep'
          )}
          
          {localSettings?.quiet_hours_enabled && (
            <View style={styles.quietHoursConfig}>
              <Text style={styles.quietHoursText}>
                Das 22:00 às 08:00 (configurável no futuro)
              </Text>
            </View>
          )}
        </View>

        {/* Test Notification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teste</Text>
          <Text style={styles.sectionDescription}>
            Envie uma notificação de teste para verificar se está funcionando
          </Text>
          
          <Button
            mode="outlined"
            onPress={sendTestNotification}
            style={styles.testButton}
            icon="send"
          >
            Enviar Notificação de Teste
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: getSpacing('md'),
    color: theme.colors.onSurfaceVariant,
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
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: theme.colors.surface,
    marginBottom: getSpacing('md'),
    paddingVertical: getSpacing('md'),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    paddingHorizontal: getSpacing('md'),
    marginBottom: getSpacing('xs'),
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    paddingHorizontal: getSpacing('md'),
    marginBottom: getSpacing('md'),
  },
  settingItem: {
    paddingHorizontal: getSpacing('md'),
  },
  divider: {
    marginVertical: getSpacing('sm'),
  },
  quietHoursConfig: {
    paddingHorizontal: getSpacing('md'),
    paddingVertical: getSpacing('sm'),
    backgroundColor: theme.colors.surfaceVariant,
  },
  quietHoursText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  testButton: {
    marginHorizontal: getSpacing('md'),
    marginTop: getSpacing('sm'),
  },
});

export default NotificationSettingsScreen;
