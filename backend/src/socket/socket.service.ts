import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyAccessToken } from '../utils/jwt';
import { MessageService } from '../services/message.service';
import { logger } from '../utils/logger';
import { config } from '../config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    email: string;
  };
}

interface Socket {
  id: string;
  handshake: any;
  emit: (event: string, data: any) => void;
  join: (room: string) => void;
  leave: (room: string) => void;
  on: (event: string, callback: Function) => void;
  disconnect: () => void;
}

export class SocketService {
  private io: SocketIOServer;
  private messageService: MessageService;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private typingUsers: Map<string, Set<string>> = new Map(); // channelId -> Set of userIds

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: config.cors.origin,
        credentials: true,
      },
    });

    this.messageService = new MessageService();
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use((socket: any, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = verifyAccessToken(token);
        socket.userId = decoded.userId;
        socket.user = decoded;
        
        logger.info(`Socket authenticated for user: ${decoded.userId}`);
        next();
      } catch (error) {
        logger.error('Socket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`User connected: ${socket.userId} (${socket.id})`);

      // Track connected user
      this.addConnectedUser(socket.userId!, socket.id);

      // Join user to their personal room for direct messages
      socket.join(`user:${socket.userId}`);

      // Handle joining workspace/channel rooms
      socket.on('join:workspace', (workspaceId: string) => {
        socket.join(`workspace:${workspaceId}`);
        logger.info(`User ${socket.userId} joined workspace: ${workspaceId}`);
      });

      socket.on('join:channel', (channelId: string) => {
        socket.join(`channel:${channelId}`);
        logger.info(`User ${socket.userId} joined channel: ${channelId}`);
        
        // Notify others that user is online in this channel
        socket.to(`channel:${channelId}`).emit('user:online', {
          userId: socket.userId,
          channelId,
        });
      });

      socket.on('leave:channel', (channelId: string) => {
        socket.leave(`channel:${channelId}`);
        
        // Stop typing if user was typing
        this.handleStopTyping(socket, channelId);
        
        // Notify others that user left
        socket.to(`channel:${channelId}`).emit('user:offline', {
          userId: socket.userId,
          channelId,
        });
      });

      // Handle channel messages
      socket.on('message:send', async (data: { channelId: string; content: string }) => {
        try {
          const message = await this.messageService.createMessage(
            socket.userId!,
            data.channelId,
            data.content
          );

          // Broadcast message to all users in the channel
          this.io.to(`channel:${data.channelId}`).emit('message:new', message);
          
          logger.info(`Message sent in channel ${data.channelId} by user ${socket.userId}`);
        } catch (error) {
          logger.error('Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle message editing
      socket.on('message:edit', async (data: { messageId: string; content: string }) => {
        try {
          const message = await this.messageService.updateMessage(
            data.messageId,
            socket.userId!,
            data.content
          );

          // Broadcast updated message to channel
          this.io.to(`channel:${message.channelId}`).emit('message:updated', message);
          
          logger.info(`Message ${data.messageId} edited by user ${socket.userId}`);
        } catch (error) {
          logger.error('Error editing message:', error);
          socket.emit('error', { message: 'Failed to edit message' });
        }
      });

      // Handle message deletion
      socket.on('message:delete', async (data: { messageId: string }) => {
        try {
          await this.messageService.deleteMessage(data.messageId, socket.userId!);

          // Broadcast deletion to channel (we'll need to get channelId from message)
          // For now, we'll emit to all connected sockets of the user
          socket.emit('message:deleted', { messageId: data.messageId });
          
          logger.info(`Message ${data.messageId} deleted by user ${socket.userId}`);
        } catch (error) {
          logger.error('Error deleting message:', error);
          socket.emit('error', { message: 'Failed to delete message' });
        }
      });

      // Handle direct messages
      socket.on('dm:send', async (data: { receiverId: string; content: string }) => {
        try {
          const directMessage = await this.messageService.createDirectMessage(
            socket.userId!,
            data.receiverId,
            data.content
          );

          // Send to both sender and receiver
          socket.emit('dm:new', directMessage);
          socket.to(`user:${data.receiverId}`).emit('dm:new', directMessage);
          
          logger.info(`Direct message sent from ${socket.userId} to ${data.receiverId}`);
        } catch (error) {
          logger.error('Error sending direct message:', error);
          socket.emit('error', { message: 'Failed to send direct message' });
        }
      });

      // Handle typing indicators
      socket.on('typing:start', (data: { channelId: string }) => {
        this.handleStartTyping(socket, data.channelId);
      });

      socket.on('typing:stop', (data: { channelId: string }) => {
        this.handleStopTyping(socket, data.channelId);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`User disconnected: ${socket.userId} (${socket.id})`);
        
        // Remove from connected users
        this.removeConnectedUser(socket.userId!, socket.id);
        
        // Clean up typing indicators
        this.cleanupTypingForUser(socket.userId!);
        
        // Notify channels about user going offline
        // Note: In a production app, you'd want to check if user has other active connections
        // before marking them as offline
      });
    });
  }

  private handleStartTyping(socket: AuthenticatedSocket, channelId: string) {
    if (!this.typingUsers.has(channelId)) {
      this.typingUsers.set(channelId, new Set());
    }
    
    const typingInChannel = this.typingUsers.get(channelId)!;
    const wasEmpty = typingInChannel.size === 0;
    
    typingInChannel.add(socket.userId!);
    
    // Broadcast typing indicator to others in the channel
    socket.to(`channel:${channelId}`).emit('typing:start', {
      userId: socket.userId,
      channelId,
    });
    
    // Set timeout to auto-stop typing after 3 seconds
    setTimeout(() => {
      this.handleStopTyping(socket, channelId);
    }, 3000);
  }

  private handleStopTyping(socket: AuthenticatedSocket, channelId: string) {
    const typingInChannel = this.typingUsers.get(channelId);
    if (typingInChannel && typingInChannel.has(socket.userId!)) {
      typingInChannel.delete(socket.userId!);
      
      // Broadcast stop typing to others in the channel
      socket.to(`channel:${channelId}`).emit('typing:stop', {
        userId: socket.userId,
        channelId,
      });
      
      // Clean up empty sets
      if (typingInChannel.size === 0) {
        this.typingUsers.delete(channelId);
      }
    }
  }

  private addConnectedUser(userId: string, socketId: string) {
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)!.add(socketId);
  }

  private removeConnectedUser(userId: string, socketId: string) {
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        this.connectedUsers.delete(userId);
      }
    }
  }

  private cleanupTypingForUser(userId: string) {
    for (const [channelId, typingUsers] of this.typingUsers.entries()) {
      if (typingUsers.has(userId)) {
        typingUsers.delete(userId);
        
        // Broadcast stop typing
        this.io.to(`channel:${channelId}`).emit('typing:stop', {
          userId,
          channelId,
        });
        
        if (typingUsers.size === 0) {
          this.typingUsers.delete(channelId);
        }
      }
    }
  }

  // Public methods for external use
  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  public getOnlineUsersInChannel(channelId: string): string[] {
    const sockets = this.io.sockets.adapter.rooms.get(`channel:${channelId}`);
    if (!sockets) return [];
    
    const userIds: string[] = [];
    for (const socketId of sockets) {
      const socket = this.io.sockets.sockets.get(socketId) as AuthenticatedSocket;
      if (socket?.userId) {
        userIds.push(socket.userId);
      }
    }
    
    return [...new Set(userIds)]; // Remove duplicates
  }

  public emitToChannel(channelId: string, event: string, data: any) {
    this.io.to(`channel:${channelId}`).emit(event, data);
  }

  public emitToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }
}