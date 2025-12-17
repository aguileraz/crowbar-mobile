/**
 * Shared Room Service
 * Gerencia salas de abertura compartilhadas em tempo real
 */

import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SharedRoom,
  RoomParticipant,
  RoomSettings,
  SocialUser,
  _SocialEvent,
  _SocketMessage,
  ParticipantReaction,
  ROOM_LIMITS,
} from '../types/social';
import { EmojiReactionType, GameThemeType } from '../types/animations';
import { analyticsService } from './analyticsService';
import advancedHapticService from './advancedHapticService';

interface RoomEventCallbacks {
  onRoomUpdate: (room: SharedRoom) => void;
  onParticipantJoin: (participant: RoomParticipant) => void;
  onParticipantLeave: (userId: string) => void;
  onReactionAdd: (reaction: ParticipantReaction) => void;
  onBoxOpened: (userId: string, result: any) => void;
  onCountdownStart: (duration: number) => void;
  onError: (error: string) => void;
}

class SharedRoomService {
  private static instance: SharedRoomService;
  private socket: Socket | null = null;
  private currentRoom: SharedRoom | null = null;
  private currentUser: SocialUser | null = null;
  private eventCallbacks: Partial<RoomEventCallbacks> = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;

  private constructor() {
    this.loadUserData();
  }

  static getInstance(): SharedRoomService {
    if (!SharedRoomService.instance) {
      SharedRoomService.instance = new SharedRoomService();
    }
    return SharedRoomService.instance;
  }

  /**
   * Carrega dados do usuário atual
   */
  private async loadUserData(): Promise<void> {
    try {
      const userData = await AsyncStorage.getItem('current_user');
      if (userData) {
        this.currentUser = JSON.parse(userData);
      }
    } catch (error) {
      // console.warn('Erro ao carregar dados do usuário:', error);
    }
  }

  /**
   * Conecta ao servidor WebSocket
   */
  async connect(serverUrl: string = 'wss://api.crowbar.com'): Promise<void> {
    if (this.isConnecting || this.socket?.connected) {
      return;
    }

    this.isConnecting = true;

    try {
      this.socket = io(serverUrl, {
        transports: ['websocket'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        auth: {
          userId: this.currentUser?.id,
          token: await this.getAuthToken(),
        },
      });

      this.setupSocketEventHandlers();
      
      await new Promise<void>((resolve, reject) => {
        this.socket!.on('connect', () => {
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          resolve();
        });

        this.socket!.on('connect_error', (error) => {
          // console.error('❌ Erro de conexão:', error);
          this.isConnecting = false;
          reject(error);
        });
      });

    } catch (error) {
      this.isConnecting = false;
      throw error;
    }
  }

  /**
   * Configura handlers de eventos do socket
   */
  private setupSocketEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('room:update', (room: SharedRoom) => {
      this.currentRoom = room;
      this.eventCallbacks.onRoomUpdate?.(room);
    });

    this.socket.on('participant:join', (participant: RoomParticipant) => {
      this.eventCallbacks.onParticipantJoin?.(participant);
      advancedHapticService.playGestureFeedback('tap');
    });

    this.socket.on('participant:leave', (userId: string) => {
      this.eventCallbacks.onParticipantLeave?.(userId);
    });

    this.socket.on('reaction:add', (reaction: ParticipantReaction) => {
      this.eventCallbacks.onReactionAdd?.(reaction);
      advancedHapticService.playGestureFeedback('tap');
    });

    this.socket.on('box:opened', (data: { userId: string; result: any }) => {
      this.eventCallbacks.onBoxOpened?.(data.userId, data.result);
      advancedHapticService.playPattern('rare_item');
    });

    this.socket.on('countdown:start', (duration: number) => {
      this.eventCallbacks.onCountdownStart?.(duration);
      advancedHapticService.playPattern('box_shake');
    });

    this.socket.on('error', (error: string) => {
      this.eventCallbacks.onError?.(error);
    });

    this.socket.on('disconnect', (reason) => {
      this.handleDisconnection(reason);
    });
  }

  /**
   * Lida com desconexões
   */
  private handleDisconnection(reason: string): void {
    if (reason === 'io server disconnect') {
      // Servidor forçou desconexão, não reconectar
      return;
    }

    this.reconnectAttempts++;
    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
    }
  }

  /**
   * Registra callbacks de eventos
   */
  setEventCallbacks(callbacks: Partial<RoomEventCallbacks>): void {
    this.eventCallbacks = { ...this.eventCallbacks, ...callbacks };
  }

  /**
   * Lista salas disponíveis
   */
  async listAvailableRooms(): Promise<SharedRoom[]> {
    if (!this.socket?.connected) {
      throw new Error('Não conectado ao servidor');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('rooms:list', {}, (response: any) => {
        if (response.success) {
          resolve(response.rooms);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  /**
   * Cria uma nova sala
   */
  async createRoom(config: {
    name: string;
    description?: string;
    theme: GameThemeType;
    maxParticipants: number;
    isPrivate: boolean;
    password?: string;
    settings: Partial<RoomSettings>;
  }): Promise<SharedRoom> {
    if (!this.socket?.connected) {
      throw new Error('Não conectado ao servidor');
    }

    // Validações
    if (!config.name || config.name.length > ROOM_LIMITS.MAX_NAME_LENGTH) {
      throw new Error('Nome da sala inválido');
    }

    if (config.maxParticipants < ROOM_LIMITS.MIN_PARTICIPANTS || 
        config.maxParticipants > ROOM_LIMITS.MAX_PARTICIPANTS) {
      throw new Error('Número de participantes inválido');
    }

    const defaultSettings: RoomSettings = {
      allowSpectators: true,
      enableChat: true,
      enableReactions: true,
      enableBetting: false,
      countdownDuration: ROOM_LIMITS.DEFAULT_COUNTDOWN,
      simultaneousOpening: true,
      revealDelay: 2,
      autoCloseAfter: 300, // 5 minutos
    };

    const roomData = {
      ...config,
      hostId: this.currentUser!.id,
      settings: { ...defaultSettings, ...config.settings },
    };

    return new Promise((resolve, reject) => {
      this.socket!.emit('room:create', roomData, (response: any) => {
        if (response.success) {
          this.currentRoom = response.room;
          analyticsService.trackEngagement('room_created', config.theme, 1);
          resolve(response.room);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  /**
   * Entra em uma sala
   */
  async joinRoom(roomId: string, password?: string): Promise<SharedRoom> {
    if (!this.socket?.connected) {
      throw new Error('Não conectado ao servidor');
    }

    if (!this.currentUser) {
      throw new Error('Usuário não autenticado');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('room:join', { 
        roomId, 
        password,
        userId: this.currentUser!.id 
      }, (response: any) => {
        if (response.success) {
          this.currentRoom = response.room;
          analyticsService.trackEngagement('room_joined', response.room.theme, 1);
          resolve(response.room);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  /**
   * Sai da sala atual
   */
  async leaveRoom(): Promise<void> {
    if (!this.socket?.connected || !this.currentRoom) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('room:leave', { 
        roomId: this.currentRoom!.id,
        userId: this.currentUser!.id 
      }, (response: any) => {
        if (response.success) {
          this.currentRoom = null;
          analyticsService.trackEngagement('room_left', '', 1);
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  /**
   * Atualiza configurações da sala (apenas host)
   */
  async updateRoomSettings(settings: Partial<RoomSettings>): Promise<void> {
    if (!this.socket?.connected || !this.currentRoom) {
      throw new Error('Não conectado ou não está em uma sala');
    }

    if (this.currentRoom.hostId !== this.currentUser?.id) {
      throw new Error('Apenas o host pode alterar configurações');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('room:update_settings', {
        roomId: this.currentRoom!.id,
        settings,
      }, (response: any) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  /**
   * Marca participante como pronto
   */
  async setReady(ready: boolean): Promise<void> {
    if (!this.socket?.connected || !this.currentRoom) {
      throw new Error('Não conectado ou não está em uma sala');
    }

    this.socket.emit('participant:ready', {
      roomId: this.currentRoom.id,
      userId: this.currentUser!.id,
      ready,
    });
  }

  /**
   * Adiciona reação durante abertura
   */
  async addReaction(type: EmojiReactionType, position?: { x: number; y: number }): Promise<void> {
    if (!this.socket?.connected || !this.currentRoom) {
      throw new Error('Não conectado ou não está em uma sala');
    }

    const reaction: ParticipantReaction = {
      type,
      timestamp: new Date().toISOString(),
      position,
    };

    this.socket.emit('reaction:add', {
      roomId: this.currentRoom.id,
      userId: this.currentUser!.id,
      reaction,
    });

    // Feedback local imediato
    this.eventCallbacks.onReactionAdd?.(reaction);
    advancedHapticService.playGestureFeedback('tap');
  }

  /**
   * Inicia contagem regressiva (apenas host)
   */
  async startCountdown(): Promise<void> {
    if (!this.socket?.connected || !this.currentRoom) {
      throw new Error('Não conectado ou não está em uma sala');
    }

    if (this.currentRoom.hostId !== this.currentUser?.id) {
      throw new Error('Apenas o host pode iniciar a contagem');
    }

    this.socket.emit('countdown:start', {
      roomId: this.currentRoom.id,
    });
  }

  /**
   * Reporta abertura de caixa
   */
  async reportBoxOpened(result: any): Promise<void> {
    if (!this.socket?.connected || !this.currentRoom) {
      throw new Error('Não conectado ou não está em uma sala');
    }

    this.socket.emit('box:opened', {
      roomId: this.currentRoom.id,
      userId: this.currentUser!.id,
      result,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Convida amigo para a sala
   */
  async inviteFriend(friendId: string): Promise<void> {
    if (!this.socket?.connected || !this.currentRoom) {
      throw new Error('Não conectado ou não está em uma sala');
    }

    this.socket.emit('room:invite', {
      roomId: this.currentRoom.id,
      fromUserId: this.currentUser!.id,
      toUserId: friendId,
    });
  }

  /**
   * Obtém token de autenticação
   */
  private async getAuthToken(): Promise<string> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      return token || '';
    } catch {
      return '';
    }
  }

  /**
   * Obtém sala atual
   */
  getCurrentRoom(): SharedRoom | null {
    return this.currentRoom;
  }

  /**
   * Verifica se está conectado
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Obtém estatísticas da conexão
   */
  getConnectionStats() {
    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      currentRoom: this.currentRoom?.id || null,
      participantCount: this.currentRoom?.currentParticipants || 0,
    };
  }

  /**
   * Desconecta do servidor
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentRoom = null;
    this.eventCallbacks = {};
  }

  /**
   * Força reconexão
   */
  async forceReconnect(): Promise<void> {
    this.disconnect();
    this.reconnectAttempts = 0;
    await this.connect();
  }
}

export default SharedRoomService.getInstance();