import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { firebaseAuth } from '../config/firebase';

/**
 * Serviço de Autenticação
 * Wrapper para operações do Firebase Auth
 */

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

class AuthService {
  /**
   * Registrar novo usuário
   */
  async register(input: RegisterInput): Promise<{ user: AuthUser; token: string }> {
    try {
      // Criar usuário no Firebase Auth
      const userCredential = await firebaseAuth().createUserWithEmailAndPassword(
        input.email,
        input.password
      );

      // Atualizar perfil com nome
      if (userCredential.user) {
        await userCredential.user.updateProfile({
          displayName: input.name,
        });
      }

      // Obter token
      const token = await userCredential.user.getIdToken();

      return {
        user: this.mapFirebaseUser(userCredential.user),
        token,
      };
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Login com email e senha
   */
  async login(input: LoginInput): Promise<{ user: AuthUser; token: string }> {
    try {
      const userCredential = await firebaseAuth().signInWithEmailAndPassword(
        input.email,
        input.password
      );

      const token = await userCredential.user.getIdToken();

      return {
        user: this.mapFirebaseUser(userCredential.user),
        token,
      };
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await firebaseAuth().signOut();
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Resetar senha
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await firebaseAuth().sendPasswordResetEmail(email);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Obter usuário atual
   */
  getCurrentUser(): AuthUser | null {
    const user = firebaseAuth().currentUser;
    return user ? this.mapFirebaseUser(user) : null;
  }

  /**
   * Verificar se está autenticado
   */
  isAuthenticated(): boolean {
    return !!firebaseAuth().currentUser;
  }

  /**
   * Obter token atual
   */
  async getToken(): Promise<string | null> {
    const user = firebaseAuth().currentUser;
    if (!user) return null;
    
    try {
      return await user.getIdToken();
    } catch (error) {
      return null;
    }
  }

  /**
   * Mapear usuário do Firebase
   */
  private mapFirebaseUser(firebaseUser: FirebaseAuthTypes.User): AuthUser {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified,
    };
  }

  /**
   * Tratar erros do Firebase Auth
   */
  private handleAuthError(error: any): Error {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return new Error('Email já está em uso');
      case 'auth/invalid-email':
        return new Error('Email inválido');
      case 'auth/weak-password':
        return new Error('Senha muito fraca');
      case 'auth/user-not-found':
        return new Error('Usuário não encontrado');
      case 'auth/wrong-password':
        return new Error('Senha incorreta');
      case 'auth/network-request-failed':
        return new Error('Erro de conexão de rede');
      default:
        return new Error(error.message || 'Erro de autenticação');
    }
  }
}

export const authService = new AuthService();