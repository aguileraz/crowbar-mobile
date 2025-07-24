import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { firebaseAuth } from '../config/firebase';
import { setUser, finishInitialization } from '../store/slices/authSlice';
import { AppDispatch } from '../store';
import logger from '../services/loggerService';

/**
 * Hook para escutar mudanças no estado de autenticação do Firebase
 * Sincroniza automaticamente o estado do Redux com o Firebase Auth
 */
export const useAuthListener = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    logger.debug('🔐 Setting up Firebase Auth listener...');

    const unsubscribe = firebaseAuth().onAuthStateChanged((user) => {
      logger.debug('🔐 Auth state changed:', user ? 'User logged in' : 'User logged out');
      
      if (user) {
        // Usuário logado - mapear para o formato do Redux
        const mappedUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
        };
        
        dispatch(setUser(mappedUser));
      } else {
        // Usuário deslogado
        dispatch(setUser(null));
      }
      
      // Finalizar inicialização
      dispatch(finishInitialization());
    });

    // Cleanup function
    return () => {
      logger.debug('🔐 Cleaning up Firebase Auth listener...');
      unsubscribe();
    };
  }, [dispatch]);
};

export default useAuthListener;
