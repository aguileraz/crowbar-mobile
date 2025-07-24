/**
 * Script de migração para mover tokens do AsyncStorage para armazenamento seguro
 * Execute uma vez após atualizar o app
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '../services/secureStorage';
import logger from '../services/loggerService';

export async function migrateToSecureStorage(): Promise<void> {
  try {
    logger.info('Starting secure storage migration...', 'Migration');
    
    // Executar migração
    await secureStorage.migrateFromAsyncStorage();
    
    logger.info('Secure storage migration completed', 'Migration');
  } catch (error) {
    logger.error('Failed to migrate to secure storage', 'Migration', error);
  }
}

// Auto-executar na inicialização do app (adicionar ao App.tsx)
export async function checkAndMigrate(): Promise<void> {
  try {
    // Verificar se já foi migrado
    const migrated = await AsyncStorage.getItem('secure_storage_migrated');
    
    if (!migrated) {
      await migrateToSecureStorage();
      await AsyncStorage.setItem('secure_storage_migrated', 'true');
    }
  } catch (error) {
    logger.error('Migration check failed', 'Migration', error);
  }
}