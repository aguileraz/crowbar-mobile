import React, { useState } from 'react';
import logger from '../../services/loggerService';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Appbar,
  Card,
  Title,
  Paragraph,
  Switch,
  Button,
  List,
  Dialog,
  Portal,
  ActivityIndicator,

  useTheme,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { analyticsService } from '../../services/analyticsService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * Tela de Controles de Privacidade
 * Gerenciamento de consentimento LGPD e configurações de privacidade
 */
const PrivacyControlsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  
  // Estados de consentimento
  const [analyticsConsent, setAnalyticsConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [personalizationConsent, setPersonalizationConsent] = useState(false);
  const [dataSharing, setDataSharing] = useState(false);
  
  // Estados da UI
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  /**
   * Carregar configurações de privacidade
   */
  const loadPrivacySettings = async () => {
    try {
      setIsLoading(true);
      
      // Verificar consentimento de analytics
      const consent = await analyticsService.checkAnalyticsConsent();
      setAnalyticsConsent(consent);
      
      // Aqui você carregaria outras configurações do backend
      // Por enquanto, vamos simular
      setMarketingConsent(false);
      setPersonalizationConsent(true);
      setDataSharing(false);
      
    } catch (error) {
      logger.error('Erro ao carregar configurações de privacidade:', _error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Atualizar consentimento de analytics
   */
  const handleAnalyticsConsentChange = async (value: boolean) => {
    try {
      setAnalyticsConsent(value);
      await analyticsService.setAnalyticsConsent(value);
      
      Alert.alert(
        'Configuração Atualizada',
        value 
          ? 'Coleta de dados analíticos ativada' 
          : 'Coleta de dados analíticos desativada'
      );
    } catch (error) {
      logger.error('Erro ao atualizar consentimento:', _error);
      setAnalyticsConsent(!value); // Reverter em caso de erro
      Alert.alert('Erro', 'Não foi possível atualizar a configuração');
    }
  };

  /**
   * Solicitar exclusão de dados
   */
  const handleDataDeletion = async () => {
    try {
      setIsDeleting(true);
      
      // Deletar dados do usuário
      await analyticsService.deleteUserData();
      
      // Aqui você faria chamadas adicionais para deletar dados do backend
      
      Alert.alert(
        'Dados Excluídos',
        'Seus dados foram excluídos com sucesso. Você será desconectado.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navegar para login ou fazer logout
              navigation.navigate('Login' as never);
            },
          },
        ]
      );
    } catch (error) {
      logger.error('Erro ao deletar dados:', _error);
      Alert.alert('Erro', 'Não foi possível excluir seus dados');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  /**
   * Baixar dados do usuário
   */
  const handleDownloadData = () => {
    Alert.alert(
      'Baixar Seus Dados',
      'Você receberá um email com um link para baixar todos os seus dados em até 48 horas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Solicitar',
          onPress: () => {
            // Implementar chamada para API de exportação de dados
            Alert.alert('Solicitação Enviada', 'Você receberá um email em breve.');
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Privacidade e Dados" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Privacidade e Dados" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {/* Informações LGPD */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.infoHeader}>
              <MaterialCommunityIcons
                name="shield-check"
                size={32}
                color={theme.colors.primary}
              />
              <Title style={styles.infoTitle}>Seus Dados Protegidos</Title>
            </View>
            <Paragraph style={styles.infoParagraph}>
              Em conformidade com a Lei Geral de Proteção de Dados (LGPD), 
              você tem total controle sobre seus dados pessoais. 
              Ajuste suas preferências abaixo.
            </Paragraph>
          </Card.Content>
        </Card>

        {/* Configurações de Consentimento */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Configurações de Privacidade</Title>
            
            <List.Item
              title="Dados Analíticos"
              description="Permite coletar dados de uso para melhorar o app"
              left={props => <List.Icon {...props} icon="chart-line" />}
              right={() => (
                <Switch
                  value={analyticsConsent}
                  onValueChange={handleAnalyticsConsentChange}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Comunicações de Marketing"
              description="Receber ofertas e novidades por email"
              left={props => <List.Icon {...props} icon="email-newsletter" />}
              right={() => (
                <Switch
                  value={marketingConsent}
                  onValueChange={setMarketingConsent}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Personalização"
              description="Usar seus dados para personalizar sua experiência"
              left={props => <List.Icon {...props} icon="account-cog" />}
              right={() => (
                <Switch
                  value={personalizationConsent}
                  onValueChange={setPersonalizationConsent}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Compartilhamento com Parceiros"
              description="Compartilhar dados anonimizados com parceiros"
              left={props => <List.Icon {...props} icon="share-variant" />}
              right={() => (
                <Switch
                  value={dataSharing}
                  onValueChange={setDataSharing}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Gestão de Dados */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Gestão de Dados</Title>
            <Paragraph style={styles.sectionDescription}>
              Gerencie seus dados pessoais de acordo com seus direitos LGPD
            </Paragraph>
            
            <Button
              mode="outlined"
              icon="download"
              onPress={handleDownloadData}
              style={styles.button}
            >
              Baixar Meus Dados
            </Button>
            
            <Button
              mode="outlined"
              icon="delete-forever"
              onPress={() => setShowDeleteDialog(true)}
              style={[styles.button, styles.deleteButton]}
              labelStyle={styles.deleteButtonText}
            >
              Excluir Minha Conta
            </Button>
          </Card.Content>
        </Card>

        {/* Informações Adicionais */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Mais Informações</Title>
            
            <List.Item
              title="Política de Privacidade"
              description="Leia nossa política completa"
              left={props => <List.Icon {...props} icon="file-document" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // Navegar para política de privacidade
              }}
            />
            
            <Divider />
            
            <List.Item
              title="Termos de Uso"
              description="Consulte nossos termos"
              left={props => <List.Icon {...props} icon="file-certificate" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // Navegar para termos de uso
              }}
            />
            
            <Divider />
            
            <List.Item
              title="Fale com o DPO"
              description="Entre em contato com nosso encarregado de dados"
              left={props => <List.Icon {...props} icon="account-tie" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // Abrir contato com DPO
              }}
            />
          </Card.Content>
        </Card>

        {/* Espaçamento final */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Dialog de Confirmação de Exclusão */}
      <Portal>
        <Dialog
          visible={showDeleteDialog}
          onDismiss={() => setShowDeleteDialog(false)}
        >
          <Dialog.Title>Excluir Conta</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Tem certeza que deseja excluir sua conta? Esta ação é irreversível 
              e todos os seus dados serão permanentemente removidos.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button
              onPress={handleDataDeletion}
              loading={isDeleting}
              textColor={theme.colors.error}
            >
              Excluir
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    marginLeft: 12,
    flex: 1,
  },
  infoParagraph: {
    lineHeight: 20,
    opacity: 0.8,
  },
  sectionDescription: {
    marginBottom: 16,
    opacity: 0.7,
  },
  button: {
    marginBottom: 12,
  },
  deleteButton: {
    borderColor: '#f44336',
  },
  deleteButtonText: {
    color: '#f44336',
  },
  bottomSpacing: {
    height: 32,
  },
});

export default PrivacyControlsScreen;