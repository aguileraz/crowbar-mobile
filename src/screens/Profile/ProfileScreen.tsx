import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Button,
  IconButton,
  ActivityIndicator,
  Avatar,
  Divider,
  List,
  ProgressBar,
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Redux
import { AppDispatch } from '../../store';
import {
  fetchUserProfile,
  fetchUserStatistics,
  selectUserProfile,
  selectUserStatistics,
  selectUserLoading,
  selectUserError,
} from '../../store/slices/userSlice';
import { logout } from '../../store/slices/authSlice';

// Components
import AvatarUpload from '../../components/AvatarUpload';
import UserStatistics from '../../components/UserStatistics';
import ErrorMessage from '../../components/ErrorMessage';

// Theme
import { theme, getSpacing, getBorderRadius } from '../../theme';

/**
 * Tela de Perfil do Usuário
 * Baseada no protótipo 02_screen-CROWBAR_Perfil-V2.png
 */

type ProfileScreenNavigationProp = NativeStackNavigationProp<any, 'Profile'>;

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const profile = useSelector(selectUserProfile);
  const statistics = useSelector(selectUserStatistics);
  const isLoading = useSelector(selectUserLoading);
  const error = useSelector(selectUserError);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);

  // Load profile data
  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [])
  );

  /**
   * Load profile data
   */
  const loadProfileData = async () => {
    try {
      await Promise.all([
        dispatch(fetchUserProfile()).unwrap(),
        dispatch(fetchUserStatistics()).unwrap(),
      ]);
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => dispatch(logout()),
        },
      ]
    );
  };

  /**
   * Navigate to edit profile
   */
  const navigateToEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  /**
   * Navigate to addresses
   */
  const navigateToAddresses = () => {
    navigation.navigate('Addresses');
  };

  /**
   * Navigate to payment methods
   */
  const navigateToPaymentMethods = () => {
    navigation.navigate('PaymentMethods');
  };

  /**
   * Navigate to order history
   */
  const navigateToOrderHistory = () => {
    navigation.navigate('OrderHistory');
  };

  /**
   * Navigate to favorites
   */
  const navigateToFavorites = () => {
    navigation.navigate('Favorites');
  };

  /**
   * Navigate to settings
   */
  const navigateToSettings = () => {
    navigation.navigate('Settings');
  };

  /**
   * Get user level progress
   */
  const getLevelProgress = (): number => {
    if (!statistics) return 0;
    return statistics.experience / statistics.nextLevelExp;
  };

  /**
   * Format member since date
   */
  const formatMemberSince = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={loadProfileData}
        style={styles.container}
      />
    );
  }

  if (!profile) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Perfil não encontrado</Text>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          Voltar
        </Button>
      </View>
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
        <Title style={styles.headerTitle}>Perfil</Title>
        <IconButton
          icon="cog"
          size={24}
          onPress={navigateToSettings}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <View style={styles.profileHeader}>
              <AvatarUpload
                currentAvatar={profile.avatar}
                size={80}
                onUploadComplete={loadProfileData}
              />
              
              <View style={styles.profileInfo}>
                <Title style={styles.profileName}>{profile.name}</Title>
                <Text style={styles.profileEmail}>{profile.email}</Text>
                
                {statistics && (
                  <View style={styles.levelContainer}>
                    <Text style={styles.levelText}>
                      Nível {statistics.level}
                    </Text>
                    <ProgressBar
                      progress={getLevelProgress()}
                      color={theme.colors.primary}
                      style={styles.levelProgress}
                    />
                    <Text style={styles.expText}>
                      {statistics.experience}/{statistics.nextLevelExp} XP
                    </Text>
                  </View>
                )}
                
                <Text style={styles.memberSince}>
                  Membro desde {formatMemberSince(statistics?.memberSince || profile.created_at)}
                </Text>
              </View>
              
              <IconButton
                icon="pencil"
                size={20}
                onPress={navigateToEditProfile}
                style={styles.editButton}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Statistics */}
        {statistics && (
          <UserStatistics
            statistics={statistics}
            style={styles.statisticsCard}
          />
        )}

        {/* Menu Options */}
        <Card style={styles.menuCard}>
          <Card.Content>
            <Title style={styles.menuTitle}>Conta</Title>
            
            <List.Item
              title="Editar Perfil"
              description="Alterar dados pessoais"
              left={(props) => <List.Icon {...props} icon="account-edit" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={navigateToEditProfile}
              style={styles.menuItem}
            />
            
            <Divider />
            
            <List.Item
              title="Endereços"
              description="Gerenciar endereços de entrega"
              left={(props) => <List.Icon {...props} icon="map-marker" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={navigateToAddresses}
              style={styles.menuItem}
            />
            
            <Divider />
            
            <List.Item
              title="Métodos de Pagamento"
              description="Cartões e formas de pagamento"
              left={(props) => <List.Icon {...props} icon="credit-card" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={navigateToPaymentMethods}
              style={styles.menuItem}
            />
          </Card.Content>
        </Card>

        <Card style={styles.menuCard}>
          <Card.Content>
            <Title style={styles.menuTitle}>Atividade</Title>
            
            <List.Item
              title="Histórico de Pedidos"
              description="Ver pedidos anteriores"
              left={(props) => <List.Icon {...props} icon="package-variant" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={navigateToOrderHistory}
              style={styles.menuItem}
            />
            
            <Divider />
            
            <List.Item
              title="Favoritos"
              description="Caixas que você curtiu"
              left={(props) => <List.Icon {...props} icon="heart" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={navigateToFavorites}
              style={styles.menuItem}
            />
          </Card.Content>
        </Card>

        <Card style={styles.menuCard}>
          <Card.Content>
            <Title style={styles.menuTitle}>Configurações</Title>
            
            <List.Item
              title="Configurações"
              description="Preferências e privacidade"
              left={(props) => <List.Icon {...props} icon="cog" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={navigateToSettings}
              style={styles.menuItem}
            />
            
            <Divider />
            
            <List.Item
              title="Sair da Conta"
              description="Fazer logout do aplicativo"
              left={(props) => <List.Icon {...props} icon="logout" color={theme.colors.error} />}
              onPress={handleLogout}
              style={styles.menuItem}
              titleStyle={{ color: theme.colors.error }}
            />
          </Card.Content>
        </Card>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing('xl'),
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginBottom: getSpacing('lg'),
  },
  backButton: {
    borderRadius: getBorderRadius('md'),
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
  scrollView: {
    flex: 1,
  },
  profileCard: {
    margin: getSpacing('md'),
    borderRadius: getBorderRadius('lg'),
  },
  profileContent: {
    padding: getSpacing('lg'),
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: getSpacing('md'),
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: getSpacing('xs'),
  },
  profileEmail: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: getSpacing('md'),
  },
  levelContainer: {
    marginBottom: getSpacing('sm'),
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: getSpacing('xs'),
  },
  levelProgress: {
    height: 6,
    borderRadius: 3,
    marginBottom: getSpacing('xs'),
  },
  expText: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
  },
  memberSince: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  editButton: {
    backgroundColor: theme.colors.primaryContainer,
  },
  statisticsCard: {
    margin: getSpacing('md'),
    marginTop: 0,
  },
  menuCard: {
    margin: getSpacing('md'),
    marginTop: 0,
    borderRadius: getBorderRadius('lg'),
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: getSpacing('sm'),
  },
  menuItem: {
    paddingVertical: getSpacing('sm'),
  },
  bottomSpacer: {
    height: getSpacing('xl'),
  },
});

export default ProfileScreen;
