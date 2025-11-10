import { useEffect } from 'react';
import { Platform as _Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import notifee from '@notifee/react-native';
import logger from '../services/loggerService';

// Redux
import { AppDispatch, RootState } from '../store';
import { initializeNotifications } from '../store/slices/notificationsSlice';

// Services
import { notificationService } from '../services/notificationService';
import gotifyService, { GotifyMessage } from '../services/gotifyService';

/**
 * Componente para inicializar notificações push
 *
 * ⚠️ MIGRATION NOTICE:
 * Firebase Cloud Messaging foi REMOVIDO. Agora usa @notifee + Gotify WebSocket.
 *
 * Sistemas de notificação:
 * - @notifee/react-native: Notificações locais (Android/iOS)
 * - Gotify: Push notifications via WebSocket
 *
 * Não renderiza nada, apenas configura os listeners.
 */

const NotificationInitializer = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Obter token Gotify do Redux (será adicionado quando Keycloak estiver integrado)
  const gotifyToken = useSelector((state: RootState) =>
    state.auth.user?.gotifyToken || null
  );

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // 1. Inicializar canais de notificação (Android)
        await gotifyService.initialize();

        // Legacy: Criar canais via notificationService
        await notificationService.createNotificationChannel();

        // 2. Configurar handlers do notifee
        await notificationService.setupNotifeeHandlers();

        // 3. Inicializar notificações via Redux
        await dispatch(initializeNotifications()).unwrap();

        // 4. GOTIFY: Conectar ao WebSocket se houver token
        if (gotifyToken) {
          logger.debug('🔌 Connecting to Gotify with token');

          gotifyService.setNotificationHandler({
            onNotification: (message: GotifyMessage) => {
              logger.debug('📬 Gotify notification received:', message.title);

              // Handler customizado: atualizar Redux ou navegar
              // TODO: Adicionar ações do Redux conforme necessário
              // dispatch(addNotification(message));
            },
          });

          gotifyService.connect(gotifyToken);

          logger.debug('✅ Gotify WebSocket connected');
        } else {
          logger.debug('⚠️  No Gotify token available, skipping Gotify connection');
        }

        // 5. Background notifications via Gotify (Firebase removido)
        // Background handler é gerenciado pelo Gotify WebSocket listener

        // 6. Verificar se app foi aberto por notificação
        const initialNotification = await notificationService.getInitialNotification();
        if (initialNotification) {
          logger.debug('App opened by notification:', initialNotification);
          // Aguardar navegação estar pronta
          setTimeout(() => {
            notificationService.handleNotificationOpen(initialNotification);
          }, 1000);
        }

        logger.debug('✅ Notifications initialized successfully');
      } catch (error) {
        logger.error('❌ Failed to initialize notifications:', error);
      }
    };

    setupNotifications();

    // Cleanup
    return () => {
      // Desconectar Gotify ao desmontar
      if (gotifyService.isConnected()) {
        gotifyService.disconnect();
        logger.debug('🔌 Gotify disconnected');
      }
    };
  }, [dispatch, gotifyToken]);

  // Este componente não renderiza nada
  return null;
};

export default NotificationInitializer;