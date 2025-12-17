import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

/**
 * Loading Screen Component
 * Displayed while app is initializing
 */

const LoadingScreen: React.FC = () => {
  return (
    <View style={styles.container} testID="loading-screen">
      <ActivityIndicator size="large" color="#6200EE" testID="loading-indicator" />
      <Text style={styles.text} testID="loading-text">Carregando...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default LoadingScreen;