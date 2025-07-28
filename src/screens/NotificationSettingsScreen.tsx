import React, { useState, useCallback } from 'react';
import logger from '../services/loggerService';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Switch,
  Button,
  List,

  IconButton,
  Divider,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import {
  updateSettings,
  requestPermission,
  selectNotificationSettings,
  selectIsPermissionGranted,
  selectFcmToken,
} from '../store/slices/notificationsSlice';
import { theme, getSpacing } from '../theme';
import { useScreenTracking, useEngagementTracking } from '../hooks/useAnalytics';
import ScreenTransition from '../components/ScreenTransition';

/**
 * Tela de Configurações de Notificações
 */

interface NotificationSettingsScreenProps {
  navigation: any;
}

const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Analytics
  useScreenTracking('NotificationSettings');
  const { trackButtonClick, trackEngagement } = useEngagementTracking();

  // Redux state
  const settings = useSelector(selectNotificationSettings);
  const isPermissionGranted = useSelector(selectIsPermissionGranted);
  const fcmToken = useSelector(selectFcmToken);

  // Local state
  const [isUpdating, setIsUpdating] = useState(false);

  /**
   * Handle setting update
   */
  const handleSettingUpdate = useCallback(async (key: string, value: any) => {
    try {
      setIsUpdating(true);
      
      const updates = { [key]: value };
      await dispatch(updateSettings(updates)).unwrap();
      
      trackEngagement('notification_setting_changed', _key, value ? 1 : 0);
    } catch (error) {
      logger.error('Error updating setting:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a configuração');
    } finally {
      setIsUpdating(false);
    }
  }, [dispatch, trackEngagement]);

  /**
   * Handle quiet hours update
   */
  const handleQuietHoursUpdate = useCallback(async (field: string, value: any) => {
    if (!settings) return;
    
    try {
      setIsUpdating(true);
      
      const updates = {
        quietHours: {
          ...settings.quietHours,
          [field]: value,
        },
      };
      
      await dispatch(updateSettings(updates)).unwrap();
      trackEngagement('quiet_hours_changed', field);
    } catch (error) {
      logger.error('Error updating quiet hours:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o horário silencioso');
    } finally {
      setIsUpdating(false);
    }
  }, [dispatch, settings, trackEngagement]);

  /**
   * Handle permission request
   */
  const handlePermissionRequest = useCallback(async () => {
    try {
      trackButtonClick('request_notification_permission', 'settings');
      const result = await dispatch(requestPermission()).unwrap();
      
      if (result.granted) {
        Alert.alert(
          'Permissão Concedida',
          'Agora você receberá notificações push!'
        );
      } else {
        Alert.alert(
          'Permissão Negada',
          'Você pode ativar as notificações nas configurações do dispositivo.'
        );
      }
    } catch (error) {
      logger.error('Error requesting permission:', error);
      Alert.alert('Erro', 'Não foi possível solicitar permissão');
    }
  }, [dispatch, trackButtonClick]);

  /**
   * Handle test notification
   */
  const handleTestNotification = useCallback(() => {
    trackButtonClick('test_notification', 'settings');
    
    // This would trigger a test notification from the backend
    Alert.alert(
      'Notificação de Teste',
      'Uma notificação de teste será enviada em breve.',
      [{ text: 'OK' }]
    );
  }, [trackButtonClick]);

  if (!settings) {
    return (
      <View style={styles.container}>
        <Text>Carregando configurações...</Text>
      </View>
    );
  }

  return (
    <ScreenTransition type="slide" direction="right">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Permission Status */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.permissionHeader}>
              <View style={styles.permissionInfo}>
                <Title>Status das Permissões</Title>
                <Paragraph style={styles.permissionStatus}>
                  {isPermissionGranted ? 'Permissões concedidas' : 'Permissões negadas'}
                </Paragraph>
              </View>
              <IconButton
                icon={isPermissionGranted ? 'check-circle' : 'alert-circle'}
                iconColor={isPermissionGranted ? '#4CAF50' : '#F44336'}
                size={32}
              />
            </View>
            
            {!isPermissionGranted && (
              <Button
                mode="contained"
                onPress={handlePermissionRequest}
                style={styles.permissionButton}
              >
                Solicitar Permissão
              </Button>
            )}
            
            {__DEV__ && fcmToken && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugLabel}>FCM Token (Debug):</Text>
                <Text style={styles.debugToken} numberOfLines={2}>
                  {fcmToken}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* General Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Configurações Gerais</Title>
            
            <List.Item
              title="Notificações Push"
              description="Receber notificações no dispositivo"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={settings.enabled}
                  onValueChange={(value) => handleSettingUpdate('enabled', value)}
                  disabled={!isPermissionGranted || isUpdating}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Som"
              description="Reproduzir som ao receber notificações"
              left={(props) => <List.Icon {...props} icon="volume-high" />}
              right={() => (
                <Switch
                  value={settings.sound}
                  onValueChange={(value) => handleSettingUpdate('sound', value)}
                  disabled={!settings.enabled || isUpdating}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Vibração"
              description="Vibrar ao receber notificações"
              left={(props) => <List.Icon {...props} icon="vibrate" />}
              right={() => (
                <Switch
                  value={settings.vibration}
                  onValueChange={(value) => handleSettingUpdate('vibration', value)}
                  disabled={!settings.enabled || isUpdating}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Notification Types */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Tipos de Notificação</Title>
            
            <List.Item
              title="Pedidos"
              description="Atualizações sobre seus pedidos"
              left={(props) => <List.Icon {...props} icon="package-variant" />}
              right={() => (
                <Switch
                  value={settings.orders}
                  onValueChange={(value) => handleSettingUpdate('orders', value)}
                  disabled={!settings.enabled || isUpdating}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Promoções"
              description="Ofertas especiais e descontos"
              left={(props) => <List.Icon {...props} icon="tag" />}
              right={() => (
                <Switch
                  value={settings.promotions}
                  onValueChange={(value) => handleSettingUpdate('promotions', value)}
                  disabled={!settings.enabled || isUpdating}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Novas Caixas"
              description="Lançamentos de novas caixas"
              left={(props) => <List.Icon {...props} icon="cube-outline" />}
              right={() => (
                <Switch
                  value={settings.newBoxes}
                  onValueChange={(value) => handleSettingUpdate('newBoxes', value)}
                  disabled={!settings.enabled || isUpdating}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Social"
              description="Atividades de amigos e comunidade"
              left={(props) => <List.Icon {...props} icon="account-group" />}
              right={() => (
                <Switch
                  value={settings.social}
                  onValueChange={(value) => handleSettingUpdate('social', value)}
                  disabled={!settings.enabled || isUpdating}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Sistema"
              description="Atualizações do sistema e manutenção"
              left={(props) => <List.Icon {...props} icon="cog" />}
              right={() => (
                <Switch
                  value={settings.system}
                  onValueChange={(value) => handleSettingUpdate('system', value)}
                  disabled={!settings.enabled || isUpdating}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Quiet Hours */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Horário Silencioso</Title>
            <Paragraph style={styles.quietHoursDescription}>
              Durante o horário silencioso, você não receberá notificações com som ou vibração.
            </Paragraph>
            
            <List.Item
              title="Ativar Horário Silencioso"
              left={(props) => <List.Icon {...props} icon="sleep" />}
              right={() => (
                <Switch
                  value={settings.quietHours.enabled}
                  onValueChange={(value) => handleQuietHoursUpdate('enabled', value)}
                  disabled={!settings.enabled || isUpdating}
                />
              )}
            />
            
            {settings.quietHours.enabled && (
              <>
                <Divider />
                <View style={styles.timeSettings}>
                  <View style={styles.timeSetting}>
                    <Text style={styles.timeLabel}>Início:</Text>
                    <Text style={styles.timeValue}>{settings.quietHours.startTime}</Text>
                  </View>
                  <View style={styles.timeSetting}>
                    <Text style={styles.timeLabel}>Fim:</Text>
                    <Text style={styles.timeValue}>{settings.quietHours.endTime}</Text>
                  </View>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Test Notification */}
        {isPermissionGranted && settings.enabled && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Teste</Title>
              <Paragraph style={styles.testDescription}>
                Envie uma notificação de teste para verificar se tudo está funcionando.
              </Paragraph>
              
              <Button
                mode="outlined"
                onPress={handleTestNotification}
                style={styles.testButton}
                icon="send"
              >
                Enviar Notificação de Teste
              </Button>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </ScreenTransition>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  card: {
    margin: getSpacing('md'),
    marginBottom: getSpacing('sm'),
    elevation: 2,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: getSpacing('md'),
  },
  permissionInfo: {
    flex: 1,
  },
  permissionStatus: {
    color: theme.colors.onSurfaceVariant,
    marginTop: getSpacing('xs'),
  },
  permissionButton: {
    marginTop: getSpacing('md'),
  },
  debugInfo: {
    marginTop: getSpacing('md'),
    padding: getSpacing('sm'),
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
  },
  debugLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.onSurfaceVariant,
    marginBottom: getSpacing('xs'),
  },
  debugToken: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: theme.colors.onSurfaceVariant,
  },
  quietHoursDescription: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: getSpacing('md'),
  },
  timeSettings: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: getSpacing('md'),
  },
  timeSetting: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: getSpacing('xs'),
  },
  timeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  testDescription: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: getSpacing('md'),
  },
  testButton: {
    marginTop: getSpacing('sm'),
  },
});

export default NotificationSettingsScreen;
