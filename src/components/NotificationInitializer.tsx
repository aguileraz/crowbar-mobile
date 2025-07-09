import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useDispatch } from 'react-redux';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';

// Redux
import { AppDispatch } from '../store';
import { initializeNotifications } from '../store/slices/notificationsSlice';

// Services
import { notificationService } from '../services/notificationService';

/**
 * Componente para inicializar notificações push
 * Não renderiza nada, apenas configura os listeners
 */

const NotificationInitializer = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // Criar canais de notificação (Android)
        await notificationService.createNotificationChannel();

        // Configurar handlers do notifee
        await notificationService.setupNotifeeHandlers();

        // Inicializar notificações via Redux
        await dispatch(initializeNotifications()).unwrap();

        // Configurar handler de mensagem em background
        messaging().setBackgroundMessageHandler(async remoteMessage => {
          console.log('Background message received:', remoteMessage);
          
          // Exibir notificação local quando app está em background
          if (remoteMessage.notification) {
            await notifee.displayNotification({
              title: remoteMessage.notification.title || 'Nova notificação',
              body: remoteMessage.notification.body || '',
              data: remoteMessage.data,
              android: {
                channelId: remoteMessage.data?.channelId || 'default',
                smallIcon: 'ic_notification',
                pressAction: {
                  id: 'default',
                },
              },
            });
          }
        });

        // Verificar se app foi aberto por notificação
        const initialNotification = await notificationService.getInitialNotification();
        if (initialNotification) {
          console.log('App opened by notification:', initialNotification);
          // Aguardar navegação estar pronta
          setTimeout(() => {
            notificationService.handleNotificationOpen(initialNotification);
          }, 1000);
        }

        console.log('✅ Notifications initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize notifications:', error);
      }
    };

    setupNotifications();

    // Cleanup
    return () => {
      // Limpar listeners se necessário
    };
  }, [dispatch]);

  // Este componente não renderiza nada
  return null;
};

export default NotificationInitializer;