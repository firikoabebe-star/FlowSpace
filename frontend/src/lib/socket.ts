import { io, Socket } from 'socket.io-client';
import { Message, DirectMessage } from '@/types';

class SocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    this.setupEventHandlers();
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.handleReconnect();
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      
      setTimeout(() => {
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.socket?.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      // Could emit an event here to notify the UI
    }
  }

  // Workspace/Channel methods
  joinWorkspace(workspaceId: string) {
    this.socket?.emit('join:workspace', workspaceId);
  }

  joinChannel(channelId: string) {
    this.socket?.emit('join:channel', channelId);
  }

  leaveChannel(channelId: string) {
    this.socket?.emit('leave:channel', channelId);
  }

  // Message methods
  sendMessage(channelId: string, content: string) {
    this.socket?.emit('message:send', { channelId, content });
  }

  editMessage(messageId: string, content: string) {
    this.socket?.emit('message:edit', { messageId, content });
  }

  deleteMessage(messageId: string) {
    this.socket?.emit('message:delete', { messageId });
  }

  // Direct message methods
  sendDirectMessage(receiverId: string, content: string) {
    this.socket?.emit('dm:send', { receiverId, content });
  }

  // Typing indicators
  startTyping(channelId: string) {
    this.socket?.emit('typing:start', { channelId });
  }

  stopTyping(channelId: string) {
    this.socket?.emit('typing:stop', { channelId });
  }

  // Event listeners
  onNewMessage(callback: (message: Message) => void) {
    this.socket?.on('message:new', callback);
  }

  onMessageUpdated(callback: (message: Message) => void) {
    this.socket?.on('message:updated', callback);
  }

  onMessageDeleted(callback: (data: { messageId: string }) => void) {
    this.socket?.on('message:deleted', callback);
  }

  onNewDirectMessage(callback: (message: DirectMessage) => void) {
    this.socket?.on('dm:new', callback);
  }

  onTypingStart(callback: (data: { userId: string; channelId: string }) => void) {
    this.socket?.on('typing:start', callback);
  }

  onTypingStop(callback: (data: { userId: string; channelId: string }) => void) {
    this.socket?.on('typing:stop', callback);
  }

  onUserOnline(callback: (data: { userId: string; channelId: string }) => void) {
    this.socket?.on('user:online', callback);
  }

  onUserOffline(callback: (data: { userId: string; channelId: string }) => void) {
    this.socket?.on('user:offline', callback);
  }

  // Remove event listeners
  off(event: string, callback?: Function) {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  get connected(): boolean {
    return this.socket?.connected || false;
  }

  get id(): string | undefined {
    return this.socket?.id;
  }
}

export const socketManager = new SocketManager();