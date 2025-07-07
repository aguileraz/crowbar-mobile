import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { firebaseAuth } from '../../config/firebase';

/**
 * Authentication Redux Slice
 * Gerencia o estado de autenticação do usuário usando Firebase Auth
 */

// Tipos para o estado de autenticação
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  lastLoginTime: number | null;
}

// Estado inicial
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,
  error: null,
  lastLoginTime: null,
};

// Função utilitária para converter FirebaseUser para User
const mapFirebaseUser = (firebaseUser: FirebaseAuthTypes.User): User => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email,
  displayName: firebaseUser.displayName,
  photoURL: firebaseUser.photoURL,
  emailVerified: firebaseUser.emailVerified,
});

// Async Thunks para operações de autenticação

/**
 * Login com email e senha
 */
export const loginWithEmail = createAsyncThunk(
  'auth/loginWithEmail',
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const userCredential = await firebaseAuth().signInWithEmailAndPassword(email, password);
      return mapFirebaseUser(userCredential.user);
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Mapear erros do Firebase para mensagens em português
      let errorMessage = 'Erro desconhecido ao fazer login';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Senha incorreta';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Conta desabilitada';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Erro de conexão. Verifique sua internet';
          break;
        default:
          errorMessage = error.message || 'Erro ao fazer login';
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Registro com email e senha
 */
export const registerWithEmail = createAsyncThunk(
  'auth/registerWithEmail',
  async (
    { email, password, displayName }: { email: string; password: string; displayName?: string },
    { rejectWithValue }
  ) => {
    try {
      const userCredential = await firebaseAuth().createUserWithEmailAndPassword(email, password);
      
      // Atualizar perfil com nome se fornecido
      if (displayName) {
        await userCredential.user.updateProfile({ displayName });
      }
      
      return mapFirebaseUser(userCredential.user);
    } catch (error: any) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Erro desconhecido ao criar conta';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Este email já está em uso';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/weak-password':
          errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Erro de conexão. Verifique sua internet';
          break;
        default:
          errorMessage = error.message || 'Erro ao criar conta';
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Logout
 */
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await firebaseAuth().signOut();
      return null;
    } catch (error: any) {
      console.error('Logout error:', error);
      return rejectWithValue('Erro ao fazer logout');
    }
  }
);

/**
 * Reset de senha
 */
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      await firebaseAuth().sendPasswordResetEmail(email);
      return email;
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Erro ao enviar email de recuperação';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Erro de conexão. Verifique sua internet';
          break;
        default:
          errorMessage = error.message || 'Erro ao enviar email de recuperação';
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Verificar estado de autenticação atual
 */
export const checkAuthState = createAsyncThunk(
  'auth/checkAuthState',
  async (_, { rejectWithValue }) => {
    try {
      return new Promise<User | null>((resolve) => {
        const unsubscribe = firebaseAuth().onAuthStateChanged((user) => {
          unsubscribe();
          if (user) {
            resolve(mapFirebaseUser(user));
          } else {
            resolve(null);
          }
        });
      });
    } catch (error: any) {
      console.error('Auth state check error:', error);
      return rejectWithValue('Erro ao verificar estado de autenticação');
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Limpar erro
    clearError: (state) => {
      state.error = null;
    },
    
    // Definir usuário (para uso com listener de auth state)
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.isInitializing = false;
    },
    
    // Finalizar inicialização
    finishInitialization: (state) => {
      state.isInitializing = false;
    },
  },
  extraReducers: (builder) => {
    // Login com email
    builder
      .addCase(loginWithEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.lastLoginTime = Date.now();
        state.error = null;
      })
      .addCase(loginWithEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Registro com email
    builder
      .addCase(registerWithEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerWithEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.lastLoginTime = Date.now();
        state.error = null;
      })
      .addCase(registerWithEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.lastLoginTime = null;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Reset de senha
    builder
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Verificar estado de autenticação
    builder
      .addCase(checkAuthState.pending, (state) => {
        state.isInitializing = true;
      })
      .addCase(checkAuthState.fulfilled, (state, action) => {
        state.isInitializing = false;
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
      })
      .addCase(checkAuthState.rejected, (state, action) => {
        state.isInitializing = false;
        state.error = action.payload as string;
      });
  },
});

// Actions
export const { clearError, setUser, finishInitialization } = authSlice.actions;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectIsLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectIsInitializing = (state: { auth: AuthState }) => state.auth.isInitializing;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;

export default authSlice.reducer;
