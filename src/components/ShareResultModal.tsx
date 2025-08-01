import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Share,
  Alert,
  ScrollView,
} from 'react-native';
import {
  Modal,
  Text,
  Button,
  IconButton,
  Card,
  Chip,

  Divider,
} from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { shareOpeningResult } from '../store/slices/boxOpeningSlice';
import { BoxOpeningResult, MysteryBox } from '../types/api';
import { theme, getSpacing, getBorderRadius } from '../theme';
import { analyticsService } from '../services/analyticsService';

/**
 * Modal de Compartilhamento de Resultado
 * Permite compartilhar resultados da abertura de caixa
 */

interface ShareResultModalProps {
  visible: boolean;
  onDismiss: () => void;
  openingResult: BoxOpeningResult | null;
  box: MysteryBox;
}

const ShareResultModal: React.FC<ShareResultModalProps> = ({
  visible,
  onDismiss,
  openingResult,
  box,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isSharing, setIsSharing] = useState(false);

  /**
   * Format currency
   */
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  /**
   * Get total value of items
   */
  const getTotalValue = (): number => {
    if (!openingResult) return 0;
    return openingResult.items.reduce((sum, item) => sum + (item.value || 0), 0);
  };

  /**
   * Get rarest item
   */
  const getRarestItem = () => {
    if (!openingResult || openingResult.items.length === 0) return null;
    
    const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
    
    return openingResult.items.reduce((rarest, item) => {
      const itemRarityIndex = rarityOrder.indexOf(item.rarity?.toLowerCase() || 'common');
      const rarestRarityIndex = rarityOrder.indexOf(rarest.rarity?.toLowerCase() || 'common');
      
      return itemRarityIndex > rarestRarityIndex ? item : rarest;
    });
  };

  /**
   * Generate share text
   */
  const generateShareText = (): string => {
    if (!openingResult) return '';
    
    const rarestItem = getRarestItem();
    const totalValue = getTotalValue();
    const profit = totalValue - box.price;
    
    let text = `🎁 Acabei de abrir uma ${box.name} no Crowbar!\n\n`;
    text += `💰 Valor investido: ${formatCurrency(box.price)}\n`;
    text += `💎 Valor recebido: ${formatCurrency(totalValue)}\n`;
    text += `📈 ${profit >= 0 ? 'Lucro' : 'Prejuízo'}: ${formatCurrency(Math.abs(profit))}\n\n`;
    
    if (rarestItem) {
      text += `🌟 Item mais raro: ${rarestItem.name} (${rarestItem.rarity?.toUpperCase()})\n\n`;
    }
    
    text += `📦 Total de itens: ${openingResult.items.length}\n\n`;
    text += `Baixe o Crowbar e abra suas caixas também! 🚀`;
    
    return text;
  };

  /**
   * Share via native share
   */
  const handleNativeShare = async () => {
    try {
      setIsSharing(true);
      
      const shareText = generateShareText();
      
      const _result = await Share.share({
        message: shareText,
        title: 'Resultado da Abertura de Caixa - Crowbar',
      });
      
      if (_result.action === Share.sharedAction) {
        // Track share event
        if (openingResult) {
          dispatch(shareOpeningResult({
            resultId: openingResult.id,
            platform: 'native',
          }));
          
          // Rastrear compartilhamento
          analyticsService.trackBoxShared({
            box_id: box.id,
            box_name: box.name,
            share_method: 'native_share',
            items_received: openingResult.items.length,
          });
          
          // Rastrear compartilhamento social
          analyticsService.trackSocialShare({
            content_type: 'box_opening_result',
            content_id: openingResult.id,
            share_method: 'native',
          });
          
          // Rastrear engajamento
          analyticsService.trackEngagement('share_result', 'box_opening', totalValue);
        }
        
        Alert.alert('Sucesso', 'Resultado compartilhado!');
        onDismiss();
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao compartilhar resultado');
    } finally {
      setIsSharing(false);
    }
  };

  /**
   * Share to specific platform
   */
  const handlePlatformShare = async (platform: string) => {
    try {
      setIsSharing(true);
      
      if (openingResult) {
        await dispatch(shareOpeningResult({
          resultId: openingResult.id,
          platform,
        })).unwrap();
        
        // Rastrear compartilhamento
        analyticsService.trackBoxShared({
          box_id: box.id,
          box_name: box.name,
          share_method: platform,
          items_received: openingResult.items.length,
        });
        
        // Rastrear compartilhamento social
        analyticsService.trackSocialShare({
          content_type: 'box_opening_result',
          content_id: openingResult.id,
          share_method: platform,
        });
        
        // Rastrear engajamento
        const totalValue = getTotalValue();
        analyticsService.trackEngagement(`share_${platform}`, 'box_opening', totalValue);
        
        Alert.alert('Sucesso', `Compartilhado no ${platform}!`);
        onDismiss();
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao compartilhar');
    } finally {
      setIsSharing(false);
    }
  };

  /**
   * Get rarity color
   */
  const getRarityColor = (rarity: string): string => {
    switch (rarity.toLowerCase()) {
      case 'common':
        return '#9E9E9E';
      case 'uncommon':
        return '#4CAF50';
      case 'rare':
        return '#2196F3';
      case 'epic':
        return '#9C27B0';
      case 'legendary':
        return '#FF9800';
      case 'mythic':
        return '#F44336';
      default:
        return theme.colors.primary;
    }
  };

  if (!openingResult) return null;

  const totalValue = getTotalValue();
  const profit = totalValue - box.price;
  const rarestItem = getRarestItem();

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={styles.modal}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Compartilhar Resultado</Text>
        <IconButton
          icon="close"
          size={24}
          onPress={onDismiss}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.summaryTitle}>Resumo da Abertura</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Caixa:</Text>
              <Text style={styles.summaryValue}>{box.name}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Valor investido:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(box.price)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Valor recebido:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalValue)}</Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {profit >= 0 ? 'Lucro:' : 'Prejuízo:'}
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: profit >= 0 ? '#4CAF50' : '#F44336' },
                ]}
              >
                {formatCurrency(Math.abs(profit))}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total de itens:</Text>
              <Text style={styles.summaryValue}>{openingResult.items.length}</Text>
            </View>
            
            {rarestItem && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Item mais raro:</Text>
                <Chip
                  mode="flat"
                  style={[
                    styles.rarityChip,
                    { backgroundColor: getRarityColor(rarestItem.rarity || 'common') + '20' },
                  ]}
                  textStyle={[
                    styles.rarityChipText,
                    { color: getRarityColor(rarestItem.rarity || 'common') },
                  ]}
                  compact
                >
                  {rarestItem.rarity?.toUpperCase() || 'COMUM'}
                </Chip>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Share Options */}
        <Text style={styles.sectionTitle}>Compartilhar em:</Text>
        
        <View style={styles.shareOptions}>
          <Button
            mode="contained"
            onPress={handleNativeShare}
            loading={isSharing}
            disabled={isSharing}
            style={styles.shareButton}
            icon="share"
          >
            Compartilhar
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => handlePlatformShare('whatsapp')}
            loading={isSharing}
            disabled={isSharing}
            style={styles.shareButton}
            icon="whatsapp"
          >
            WhatsApp
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => handlePlatformShare('instagram')}
            loading={isSharing}
            disabled={isSharing}
            style={styles.shareButton}
            icon="instagram"
          >
            Instagram
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => handlePlatformShare('twitter')}
            loading={isSharing}
            disabled={isSharing}
            style={styles.shareButton}
            icon="twitter"
          >
            Twitter
          </Button>
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: theme.colors.surface,
    margin: getSpacing('lg'),
    borderRadius: getBorderRadius('lg'),
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getSpacing('lg'),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  content: {
    padding: getSpacing('lg'),
  },
  summaryCard: {
    marginBottom: getSpacing('lg'),
    borderRadius: getBorderRadius('md'),
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: getSpacing('md'),
    color: theme.colors.onSurface,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing('sm'),
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  divider: {
    marginVertical: getSpacing('md'),
  },
  rarityChip: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rarityChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: getSpacing('md'),
    color: theme.colors.onSurface,
  },
  shareOptions: {
    gap: getSpacing('sm'),
  },
  shareButton: {
    borderRadius: getBorderRadius('sm'),
  },
});

export default ShareResultModal;