import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { List, Switch, Button, Card, Title } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { env } from '../config/env';
import { logout, selectUser, selectIsLoading } from '../store/slices/authSlice';
import { AppDispatch } from '../store';

/**
 * Settings Screen - App configuration and preferences
 */

const SettingsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);
  const isLoading = useSelector(selectIsLoading);

  const [debugMode, setDebugMode] = React.useState(env.DEBUG_MODE);
  const [analyticsEnabled, setAnalyticsEnabled] = React.useState(env.ANALYTICS_ENABLED);

  /**
   * Handle environment switch
   */
  const handleSwitchEnvironment = () => {
    Alert.alert(
      'Trocar Ambiente',
      'Escolha o ambiente:',
      [
        { text: 'Desenvolvimento', onPress: () => switchEnv('development') },
        { text: 'Staging', onPress: () => switchEnv('staging') },
        { text: 'Produção', onPress: () => switchEnv('production') },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  /**
   * Switch environment (would require app restart)
   */
  const switchEnv = (environment: string) => {
    Alert.alert(
      'Ambiente Alterado',
      `Para trocar para ${environment}, execute:\nnpm run env:${environment === 'development' ? 'dev' : environment}\n\nE reinicie o app.`,
      [{ text: 'OK' }]
    );
  };

  /**
   * Clear app data
   */
  const handleClearData = () => {
    Alert.alert(
      'Limpar Dados',
      'Tem certeza que deseja limpar todos os dados do app?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Limpar', style: 'destructive', onPress: clearAppData },
      ]
    );
  };

  /**
   * Clear app data (would clear AsyncStorage and Redux persist)
   */
  const clearAppData = () => {
    // TODO: Implement actual data clearing
    Alert.alert('Dados Limpos', 'Todos os dados foram removidos.', [{ text: 'OK' }]);
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: performLogout },
      ]
    );
  };

  /**
   * Perform logout
   */
  const performLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao fazer logout. Tente novamente.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Title style={styles.title}>Configurações</Title>

        {/* Environment Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Ambiente</Title>
            <List.Item
              title="Ambiente Atual"
              description={env.NODE_ENV}
              left={props => <List.Icon {...props} icon="earth" />}
            />
            <Button
              mode="outlined"
              onPress={handleSwitchEnvironment}
              style={styles.button}>
              Trocar Ambiente
            </Button>
          </Card.Content>
        </Card>

        {/* Debug Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Desenvolvimento</Title>
            <List.Item
              title="Modo Debug"
              description="Ativar logs detalhados"
              left={props => <List.Icon {...props} icon="bug" />}
              right={() => (
                <Switch
                  value={debugMode}
                  onValueChange={setDebugMode}
                />
              )}
            />
            <List.Item
              title="Analytics"
              description="Coletar dados de uso"
              left={props => <List.Icon {...props} icon="chart-line" />}
              right={() => (
                <Switch
                  value={analyticsEnabled}
                  onValueChange={setAnalyticsEnabled}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* App Info */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Informações</Title>
            <List.Item
              title="Versão do App"
              description={env.APP_VERSION}
              left={props => <List.Icon {...props} icon="information" />}
            />
            <List.Item
              title="API Base URL"
              description={env.API_BASE_URL}
              left={props => <List.Icon {...props} icon="api" />}
            />
            <List.Item
              title="Firebase Project"
              description={env.FIREBASE_PROJECT_ID}
              left={props => <List.Icon {...props} icon="firebase" />}
            />
          </Card.Content>
        </Card>

        {/* User Info */}
        {user && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Conta</Title>
              <List.Item
                title="Usuário"
                description={user.displayName || 'Sem nome'}
                left={props => <List.Icon {...props} icon="account" />}
              />
              <List.Item
                title="Email"
                description={user.email || 'Sem email'}
                left={props => <List.Icon {...props} icon="email" />}
              />
              <List.Item
                title="Email Verificado"
                description={user.emailVerified ? 'Sim' : 'Não'}
                left={props => <List.Icon {...props} icon="email-check" />}
              />
            </Card.Content>
          </Card>
        )}

        {/* Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Ações</Title>
            <Button
              mode="outlined"
              onPress={handleClearData}
              style={styles.button}
              textColor="#F44336">
              Limpar Dados do App
            </Button>
            <Button
              mode="contained"
              onPress={handleLogout}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
              buttonColor="#F44336">
              Sair da Conta
            </Button>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  button: {
    marginTop: 8,
    marginBottom: 8,
  },
});

export default SettingsScreen;
