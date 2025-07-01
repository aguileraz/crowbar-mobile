import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Button, Card, Title, Paragraph } from 'react-native-paper';
import { env } from '../config/env';
import { testFirebaseConnection } from '../config/firebase';

/**
 * Home Screen - Main screen of the app
 * Displays app status and basic functionality tests
 */

const HomeScreen: React.FC = () => {
  const [firebaseStatus, setFirebaseStatus] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Test Firebase connection
   */
  const handleTestFirebase = async () => {
    setIsLoading(true);
    try {
      const isConnected = await testFirebaseConnection();
      setFirebaseStatus(isConnected);
      
      Alert.alert(
        'Firebase Test',
        isConnected ? 'Conexão bem-sucedida!' : 'Falha na conexão',
        [{ text: 'OK' }]
      );
    } catch (error) {
      setFirebaseStatus(false);
      Alert.alert('Erro', 'Erro ao testar Firebase', [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Show app info
   */
  const handleShowAppInfo = () => {
    Alert.alert(
      'Informações do App',
      `Versão: ${env.APP_VERSION}\nAmbiente: ${env.NODE_ENV}\nAPI: ${env.API_BASE_URL}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Title style={styles.title}>Crowbar Mobile</Title>
        <Paragraph style={styles.subtitle}>
          Aplicativo móvel para gestão de projetos
        </Paragraph>

        {/* App Status Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Status do Sistema</Title>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Ambiente:</Text>
              <Text style={styles.statusValue}>{env.NODE_ENV}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Versão:</Text>
              <Text style={styles.statusValue}>{env.APP_VERSION}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Debug:</Text>
              <Text style={styles.statusValue}>
                {env.DEBUG_MODE ? 'Ativo' : 'Inativo'}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Firebase:</Text>
              <Text style={[
                styles.statusValue,
                firebaseStatus === true && styles.statusSuccess,
                firebaseStatus === false && styles.statusError,
              ]}>
                {firebaseStatus === null ? 'Não testado' : 
                 firebaseStatus ? 'Conectado' : 'Erro'}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Actions Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Testes do Sistema</Title>
            <Button
              mode="contained"
              onPress={handleTestFirebase}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}>
              Testar Firebase
            </Button>
            <Button
              mode="outlined"
              onPress={handleShowAppInfo}
              style={styles.button}>
              Informações do App
            </Button>
          </Card.Content>
        </Card>

        {/* Configuration Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Configuração</Title>
            <Paragraph>
              API Base URL: {env.API_BASE_URL}
            </Paragraph>
            <Paragraph>
              Socket URL: {env.SOCKET_URL}
            </Paragraph>
            <Paragraph>
              Firebase Project: {env.FIREBASE_PROJECT_ID}
            </Paragraph>
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
    marginBottom: 8,
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontWeight: 'bold',
  },
  statusValue: {
    color: '#666',
  },
  statusSuccess: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  statusError: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  button: {
    marginTop: 8,
    marginBottom: 8,
  },
});

export default HomeScreen;
