/**
 * Achievements Screen
 * Tela principal para visualizar conquistas e badges
 */

import React, {useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Appbar,
  Text,
  Card,
  Chip,
  // FAB,
  Portal,
  Modal,
  Button,
  Divider,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import achievementService from '../../services/achievementService';
import { RootStackParamList } from '../../navigation/AppNavigator';
import AchievementCard from '../../components/achievements/AchievementCard';
import BadgeDisplay from '../../components/achievements/BadgeDisplay';
import {
  Achievement,
  UserAchievement,
  UserBadge,
  AchievementProgress,
  AchievementStats,
  AchievementCategory,
} from '../../types/achievements';
import { ACHIEVEMENT_TEMPLATES } from '../../types/achievements';

type TabType = 'achievements' | 'badges' | 'stats';

type AchievementsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Achievements'>;

interface Props {
  navigation: AchievementsScreenNavigationProp;
}

const AchievementsScreen: React.FC<Props> = ({ _navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('achievements');
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [achievementStats, setAchievementStats] = useState<AchievementStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  const loadData = async () => {
    try {
      const availableAchievements = achievementService.getAvailableAchievements();
      const userAchievs = achievementService.getUserAchievements();
      const badges = achievementService.getUserBadges();
      const stats = achievementService.getAchievementStats();

      setAchievements(availableAchievements);
      setUserAchievements(userAchievs);
      setUserBadges(badges);
      setAchievementStats(stats);
    } catch (error) {
      // console.error('Erro ao carregar conquistas:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleBadgeEquip = async (badge: UserBadge) => {
    try {
      await achievementService.equipBadge(badge.id);
      await loadData(); // Recarrega para mostrar badge equipado
    } catch (error) {
      // console.error('Erro ao equipar badge:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const getAchievementProgress = (achievement: Achievement): AchievementProgress => {
    return achievementService.getAchievementProgress(achievement.id) || {
      achievementId: achievement.id,
      currentValue: 0,
      targetValue: achievement.condition.target,
      percentage: 0,
      isCompleted: false,
      canClaim: false,
    };
  };

  const isAchievementUnlocked = (achievementId: string): boolean => {
    return userAchievements.some(ua => ua.achievementId === achievementId && ua.isCompleted);
  };

  const filteredAchievements = achievements.filter(achievement => 
    selectedCategory === 'all' || achievement.category === selectedCategory
  );

  const categories: Array<{ key: AchievementCategory | 'all'; label: string; icon: string }> = [
    { key: 'all', label: 'Todas', icon: 'view-grid' },
    { key: 'social', label: 'Social', icon: 'account-group' },
    { key: 'boxes', label: 'Caixas', icon: 'package-variant' },
    { key: 'reactions', label: 'Reações', icon: 'emoticon-happy' },
    { key: 'betting', label: 'Apostas', icon: 'medal' },
    { key: 'special', label: 'Especiais', icon: 'star' },
  ];

  const equippedBadge = userBadges.find(badge => badge.isEquipped);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'achievements':
        return (
          <View style={styles.tabContent}>
            {/* Filtros de categoria */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryFilters}
            >
              {categories.map(category => (
                <Chip
                  key={category.key}
                  selected={selectedCategory === category.key}
                  onPress={() => setSelectedCategory(category.key)}
                  style={styles.categoryChip}
                  icon={category.icon}
                >
                  {category.label}
                </Chip>
              ))}
            </ScrollView>

            {/* Lista de conquistas */}
            <ScrollView
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              {filteredAchievements.map(achievement => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  progress={getAchievementProgress(achievement)}
                  isUnlocked={isAchievementUnlocked(achievement.id)}
                  showDetails
                />
              ))}
              
              {filteredAchievements.length === 0 && (
                <View style={styles.emptyState}>
                  <Icon name="trophy-outline" size={64} color="#ccc" />
                  <Text variant="bodyLarge" style={styles.emptyText}>
                    Nenhuma conquista encontrada
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        );

      case 'badges':
        return (
          <View style={styles.tabContent}>
            {/* Badge equipado atualmente */}
            {equippedBadge && (
              <Card style={styles.equippedBadgeCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Badge Equipado
                  </Text>
                  <BadgeDisplay
                    badges={[equippedBadge]}
                    equippedBadgeId={equippedBadge.id}
                    horizontal
                  />
                </Card.Content>
              </Card>
            )}

            {/* Todos os badges */}
            <Card style={styles.badgesCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Meus Badges ({userBadges.length})
                </Text>
                {userBadges.length > 0 ? (
                  <BadgeDisplay
                    badges={userBadges}
                    onBadgeSelect={handleBadgeEquip}
                    equippedBadgeId={equippedBadge?.id}
                    showEquipButton
                  />
                ) : (
                  <View style={styles.emptyState}>
                    <Icon name="shield-outline" size={48} color="#ccc" />
                    <Text variant="bodyMedium" style={styles.emptyText}>
                      Nenhum badge conquistado ainda
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          </View>
        );

      case 'stats':
        return (
          <View style={styles.tabContent}>
            {achievementStats && (
              <>
                <Card style={styles.statsCard}>
                  <Card.Content>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Estatísticas Gerais
                    </Text>
                    
                    <View style={styles.statsGrid}>
                      <View style={styles.statItem}>
                        <Text variant="headlineMedium" style={styles.statValue}>
                          {achievementStats.unlockedAchievements}
                        </Text>
                        <Text variant="bodyMedium" style={styles.statLabel}>
                          Conquistas
                        </Text>
                      </View>

                      <View style={styles.statItem}>
                        <Text variant="headlineMedium" style={styles.statValue}>
                          {Math.round(achievementStats.completionPercentage)}%
                        </Text>
                        <Text variant="bodyMedium" style={styles.statLabel}>
                          Completude
                        </Text>
                      </View>

                      <View style={styles.statItem}>
                        <Text variant="headlineMedium" style={styles.statValue}>
                          {achievementStats.pointsEarned}
                        </Text>
                        <Text variant="bodyMedium" style={styles.statLabel}>
                          Pontos
                        </Text>
                      </View>

                      <View style={styles.statItem}>
                        <Text variant="headlineMedium" style={styles.statValue}>
                          {achievementStats.rareAchievements}
                        </Text>
                        <Text variant="bodyMedium" style={styles.statLabel}>
                          Raras
                        </Text>
                      </View>
                    </View>
                  </Card.Content>
                </Card>

                {achievementStats.latestUnlocked && (
                  <Card style={styles.recentCard}>
                    <Card.Content>
                      <Text variant="titleMedium" style={styles.sectionTitle}>
                        Última Conquista
                      </Text>
                      <Text variant="bodyMedium">
                        {ACHIEVEMENT_TEMPLATES.find(a => 
                          a.id === achievementStats.latestUnlocked?.achievementId
                        )?.title || 'Conquista desconhecida'}
                      </Text>
                      <Text variant="bodySmall" style={styles.dateText}>
                        {new Date(achievementStats.latestUnlocked.unlockedAt).toLocaleDateString('pt-BR')}
                      </Text>
                    </Card.Content>
                  </Card>
                )}
              </>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Appbar.Header>
        <Appbar.Content title="Conquistas" />
        <Appbar.Action
          icon="information"
          onPress={() => setShowStatsModal(true)}
        />
      </Appbar.Header>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'achievements' && styles.activeTab]}
          onPress={() => setActiveTab('achievements')}
        >
          <Icon
            name="trophy"
            size={24}
            color={activeTab === 'achievements' ? '#1976D2' : '#666'}
          />
          <Text
            variant="bodySmall"
            style={[
              styles.tabLabel,
              activeTab === 'achievements' && styles.activeTabLabel,
            ]}
          >
            Conquistas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'badges' && styles.activeTab]}
          onPress={() => setActiveTab('badges')}
        >
          <Icon
            name="shield"
            size={24}
            color={activeTab === 'badges' ? '#1976D2' : '#666'}
          />
          <Text
            variant="bodySmall"
            style={[
              styles.tabLabel,
              activeTab === 'badges' && styles.activeTabLabel,
            ]}
          >
            Badges
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
          onPress={() => setActiveTab('stats')}
        >
          <Icon
            name="chart-line"
            size={24}
            color={activeTab === 'stats' ? '#1976D2' : '#666'}
          />
          <Text
            variant="bodySmall"
            style={[
              styles.tabLabel,
              activeTab === 'stats' && styles.activeTabLabel,
            ]}
          >
            Estatísticas
          </Text>
        </TouchableOpacity>
      </View>

      {renderTabContent()}

      {/* Modal de informações */}
      <Portal>
        <Modal
          visible={showStatsModal}
          onDismiss={() => setShowStatsModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Card>
            <Card.Content>
              <Text variant="titleLarge" style={styles.modalTitle}>
                Sistema de Conquistas
              </Text>
              
              <Text variant="bodyMedium" style={styles.modalText}>
                Complete desafios e desbloqueie conquistas para ganhar pontos e badges exclusivos!
              </Text>

              <Divider style={styles.modalDivider} />

              <Text variant="titleMedium" style={styles.modalSubtitle}>
                Raridades:
              </Text>
              
              <View style={styles.rarityList}>
                <View style={styles.rarityItem}>
                  <View style={[styles.rarityDot, { backgroundColor: '#9E9E9E' }]} />
                  <Text>Comum - Conquistas básicas</Text>
                </View>
                <View style={styles.rarityItem}>
                  <View style={[styles.rarityDot, { backgroundColor: '#2196F3' }]} />
                  <Text>Raro - Conquistas desafiadoras</Text>
                </View>
                <View style={styles.rarityItem}>
                  <View style={[styles.rarityDot, { backgroundColor: '#9C27B0' }]} />
                  <Text>Épico - Conquistas difíceis</Text>
                </View>
                <View style={styles.rarityItem}>
                  <View style={[styles.rarityDot, { backgroundColor: '#FF9800' }]} />
                  <Text>Lendário - Conquistas únicas</Text>
                </View>
              </View>

              <Button
                mode="contained"
                onPress={() => setShowStatsModal(false)}
                style={styles.modalButton}
              >
                Entendi
              </Button>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    elevation: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#1976D2',
  },
  tabLabel: {
    marginTop: 4,
    color: '#666',
  },
  activeTabLabel: {
    color: '#1976D2',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  categoryFilters: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 8,
    elevation: 1,
  },
  categoryChip: {
    marginHorizontal: 4,
  },
  equippedBadgeCard: {
    margin: 16,
    marginBottom: 8,
  },
  badgesCard: {
    margin: 16,
    marginTop: 8,
  },
  statsCard: {
    margin: 16,
  },
  recentCard: {
    margin: 16,
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '40%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statValue: {
    fontWeight: 'bold',
    color: '#1976D2',
  },
  statLabel: {
    color: '#666',
    marginTop: 4,
  },
  dateText: {
    color: '#666',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  modalContent: {
    margin: 20,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  modalText: {
    textAlign: 'center',
    lineHeight: 20,
  },
  modalDivider: {
    marginVertical: 16,
  },
  modalSubtitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  rarityList: {
    gap: 8,
    marginBottom: 24,
  },
  rarityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rarityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  modalButton: {
    marginTop: 8,
  },
});

export default AchievementsScreen;