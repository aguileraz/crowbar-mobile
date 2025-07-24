import React from 'react';
import { ScrollView, StyleSheet, View, Image } from 'react-native';
import logger from '../services/loggerService';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Divider, 
  Chip,
  useTheme,
  Text,
} from 'react-native-paper';
import { useOffline, useOfflineCache, useOfflineImage, useOfflineAction } from '../hooks/useOffline';
import { CacheStrategy, SyncPriority } from '../services/offlineService';
import OfflineIndicator from './OfflineIndicator';
import SyncButton from './SyncButton';

/**
 * Tela de exemplo demonstrando o uso das funcionalidades offline
 * 
 * Esta tela exemplifica:
 * - Uso do hook useOffline para gerenciar estado offline
 * - Cache de dados com diferentes estratégias
 * - Cache de imagens offline
 * - Execução de ações com suporte offline
 * - Componentes visuais de status offline
 */
export const OfflineExampleScreen: React.FC = () => {
  const theme = useTheme();
  const { isOnline, pendingActions, cacheStatus } = useOffline();

  // Exemplo de cache de dados de boxes
  const { 
    data: boxes, 
    loading: boxesLoading, 
    error: boxesError,
    fetch: refreshBoxes,
  } = useOfflineCache(
    'example_boxes',
    async () => {
      // Simular busca de dados
      await new Promise(resolve => setTimeout(resolve, 1000));
      return [
        { id: '1', name: 'Box Premium', price: 29.99, image: 'https://via.placeholder.com/150' },
        { id: '2', name: 'Box Básico', price: 19.99, image: 'https://via.placeholder.com/150' },
        { id: '3', name: 'Box Familiar', price: 39.99, image: 'https://via.placeholder.com/150' },
      ];
    },
    {
      strategy: CacheStrategy.STALE_WHILE_REVALIDATE,
      priority: SyncPriority.NORMAL,
    }
  );

  // Exemplo de ação com suporte offline
  const addToCart = useOfflineAction(
    'ADD_TO_CART',
    async (data: { boxId: string; quantity: number }) => {
      // Simular adição ao carrinho
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true, message: 'Adicionado ao carrinho' };
    },
    {
      priority: SyncPriority.CRITICAL,
      optimisticUpdate: (data) => {
        logger.debug('Otimista: Adicionando ao carrinho', data);
      },
      onSuccess: (result) => {
        logger.debug('Sucesso:', result);
      },
      onError: (error) => {
        logger.error('Erro:', error);
      },
    }
  );

  // Exemplo de componente para exibir box com cache de imagem
  const BoxCard: React.FC<{ box: any }> = ({ box }) => {
    const { uri: imageUri, loading: imageLoading } = useOfflineImage(
      box.image,
      SyncPriority.LOW
    );

    return (
      <Card style={styles.boxCard}>
        <Card.Content>
          <View style={styles.boxContent}>
            <View style={styles.boxImageContainer}>
              {imageLoading ? (
                <View style={[styles.boxImage, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Text>Carregando...</Text>
                </View>
              ) : (
                <Image source={{ uri: imageUri }} style={styles.boxImage} />
              )}
            </View>
            <View style={styles.boxInfo}>
              <Title style={styles.boxTitle}>{box.name}</Title>
              <Paragraph style={styles.boxPrice}>R$ {box.price.toFixed(2)}</Paragraph>
            </View>
          </View>
        </Card.Content>
        <Card.Actions>
          <Button
            mode="contained"
            onPress={() => addToCart.execute({ boxId: box.id, quantity: 1 })}
            loading={addToCart.loading}
            disabled={addToCart.loading}
          >
            {addToCart.loading ? 'Adicionando...' : 'Adicionar ao Carrinho'}
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Indicador de status offline */}
      <OfflineIndicator showDetails={true} />

      {/* Informações de conectividade */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Status de Conectividade</Title>
          <View style={styles.statusContainer}>
            <Chip 
              icon={isOnline ? 'wifi' : 'wifi-off'} 
              style={[
                styles.statusChip,
                { backgroundColor: isOnline ? theme.colors.primaryContainer : theme.colors.errorContainer }
              ]}
            >
              {isOnline ? 'Online' : 'Offline'}
            </Chip>
            {pendingActions.length > 0 && (
              <Chip 
                icon="clock-alert" 
                style={[styles.statusChip, { backgroundColor: theme.colors.tertiary }]}
              >
                {pendingActions.length} ações pendentes
              </Chip>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Botão de sincronização */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Sincronização Manual</Title>
          <Paragraph>
            Force a sincronização dos dados com o servidor
          </Paragraph>
          <SyncButton 
            variant="contained" 
            onSyncComplete={() => {
              logger.debug('Sincronização concluída!');
            }}
          />
        </Card.Content>
      </Card>

      {/* Status do cache */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Status do Cache</Title>
          <View style={styles.cacheInfo}>
            <Text>Boxes: {cacheStatus.boxes.count} itens</Text>
            <Text>Última atualização: {
              cacheStatus.boxes.lastUpdated 
                ? new Date(cacheStatus.boxes.lastUpdated).toLocaleString()
                : 'Nunca'
            }</Text>
            <Text>Tamanho: {(cacheStatus.boxes.size / 1024).toFixed(1)} KB</Text>
          </View>
        </Card.Content>
      </Card>

      <Divider style={styles.divider} />

      {/* Lista de boxes */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Boxes Disponíveis</Title>
          <Paragraph>
            Dados carregados com cache inteligente
          </Paragraph>
          
          {boxesLoading && (
            <View style={styles.loadingContainer}>
              <Text>Carregando boxes...</Text>
            </View>
          )}

          {boxesError && (
            <View style={styles.errorContainer}>
              <Text style={{ color: theme.colors.error }}>
                Erro ao carregar boxes: {boxesError.message}
              </Text>
            </View>
          )}

          {boxes && boxes.map((box) => (
            <BoxCard key={box.id} box={box} />
          ))}

          <Button
            mode="outlined"
            onPress={refreshBoxes}
            style={styles.refreshButton}
          >
            Atualizar Boxes
          </Button>
        </Card.Content>
      </Card>

      {/* Informações técnicas */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Informações Técnicas</Title>
          <View style={styles.technicalInfo}>
            <Text style={styles.infoItem}>
              • Cache inteligente com estratégias configuráveis
            </Text>
            <Text style={styles.infoItem}>
              • Sincronização diferencial (apenas mudanças)
            </Text>
            <Text style={styles.infoItem}>
              • Priorização de ações pendentes
            </Text>
            <Text style={styles.infoItem}>
              • Compressão de dados com lz-string
            </Text>
            <Text style={styles.infoItem}>
              • Cache de imagens com react-native-blob-util
            </Text>
            <Text style={styles.infoItem}>
              • Detecção real de rede com NetInfo
            </Text>
            <Text style={styles.infoItem}>
              • Modo offline completo para navegação
            </Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  statusChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  cacheInfo: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  boxCard: {
    marginVertical: 8,
  },
  boxContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  boxImageContainer: {
    marginRight: 16,
  },
  boxImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxInfo: {
    flex: 1,
  },
  boxTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  boxPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  refreshButton: {
    marginTop: 16,
  },
  technicalInfo: {
    marginTop: 8,
  },
  infoItem: {
    marginBottom: 4,
    fontSize: 14,
  },
});

export default OfflineExampleScreen;