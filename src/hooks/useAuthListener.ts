import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import keycloakService from '../services/keycloakService';
import { setUser, finishInitialization } from '../store/slices/authSlice';
import { AppDispatch, RootState } from '../store';
import logger from '../services/loggerService';

/**
 * Hook para escutar mudanças no estado de autenticação do Keycloak
 * Sincroniza automaticamente o estado do Redux com o Keycloak OAuth2
 * 
 * ⚠️ MIGRATED: Firebase Auth → Keycloak OAuth2 (Sprint 9)
 */
export const useAuthListener = () => {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    logger.debug('🔐 Setting up Keycloak Auth listener...');

    const checkAuthState = async () => {
      try {
        const isAuthenticated = await keycloakService.isAuthenticated();
        
        if (isAuthenticated) {
          // Usuário autenticado - obter informações do usuário
          const userInfo = await keycloakService.getUserInfo();
          
          if (userInfo) {
            // Mapear informações do Keycloak para o formato do Redux
            const mappedUser = {
              uid: userInfo.sub || userInfo.id || '',
              email: userInfo.email || null,
              displayName: userInfo.name || userInfo.preferred_username || null,
              photoURL: userInfo.picture || null,
              emailVerified: userInfo.email_verified || false,
            };

            // Só atualizar se o usuário mudou
            if (!currentUser || currentUser.uid !== mappedUser.uid) {
              logger.debug('🔐 Auth state changed:', 'User logged in');
              dispatch(setUser(mappedUser));
            }
          }
        } else {
          // Usuário não autenticado
          if (currentUser !== null) {
            logger.debug('🔐 Auth state changed:', 'User logged out');
            dispatch(setUser(null));
          }
        }
      } catch (error) {
        logger.error('❌ Erro ao verificar estado de autenticação:', error);
        // Em caso de erro, assumir que usuário não está autenticado
        if (currentUser !== null) {
          dispatch(setUser(null));
        }
      } finally {
        // Finalizar inicialização apenas uma vez
        if (!isInitializedRef.current) {
          dispatch(finishInitialization());
          isInitializedRef.current = true;
        }
      }
    };

    // Verificar estado inicial imediatamente
    checkAuthState();

    // Verificar periodicamente (a cada 30 segundos)
    checkIntervalRef.current = setInterval(checkAuthState, 30000);

    // Cleanup function
    return () => {
      logger.debug('🔐 Cleaning up Keycloak Auth listener...');
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, [dispatch, currentUser]);

  // Expor função para verificação manual (útil para testes)
  return {
    checkAuthState: async () => {
      const isAuthenticated = await keycloakService.isAuthenticated();
      if (isAuthenticated) {
        const userInfo = await keycloakService.getUserInfo();
        if (userInfo) {
          const mappedUser = {
            uid: userInfo.sub || userInfo.id || '',
            email: userInfo.email || null,
            displayName: userInfo.name || userInfo.preferred_username || null,
            photoURL: userInfo.picture || null,
            emailVerified: userInfo.email_verified || false,
          };
          dispatch(setUser(mappedUser));
        }
      } else {
        dispatch(setUser(null));
      }
      dispatch(finishInitialization());
    },
  };
};

export default useAuthListener;