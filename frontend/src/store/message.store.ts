import { create } from 'zustand';
import { Message, DirectMessage } from '@/types';
import { apiClient } from '@/lib/api';
import { socketManager } from '@/lib/socket';

interface MessageState {
  // Channel messages
  channelMessages: Record<string, Message[]>; // channelId -> messages
  isLoadingMessages: boolean;
  
  // Direct messages
  directMessages: Record<string, DirectMessage[]>; // conversationId -> messages
  conversations: any[];
  isLoadingConversations: boolean;
  
  // Typing indicators
  typingUsers: Record<string, Set<string>>; // channelId -> Set of userIds
  
  // Online users
  onlineUsers: Record<string, Set<string>>; // channelId -> Set of userIds
  
  error: string | null;

  // Actions
  fetchChannelMessages: (channelId: string, limit?: number, cursor?: string) => Promise<void>;
  sendMessage: (channelId: string, content: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  
  // Direct message actions
  fetchConversations: () => Promise<void>;
  fetchDirectMessages: (otherUserId: string, limit?: number, cursor?: string) => Promise<void>;
  sendDirectMessage: (receiverId: string, content: string) => Promise<void>;
  markDirectMessagesAsRead: (otherUserId: string) => Promise<void>;
  
  // Real-time actions
  addMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  removeMessage: (messageId: string) => void;
  addDirectMessage: (message: DirectMessage) => void;
  
  // Typing indicators
  setUserTyping: (channelId: string, userId: string) => void;
  setUserStoppedTyping: (channelId: string, userId: string) => void;
  
  // Online status
  setUserOnline: (channelId: string, userId: string) => void;
  setUserOffline: (channelId: string, userId: string) => void;
  
  clearError: () => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  channelMessages: {},
  isLoadingMessages: false,
  directMessages: {},
  conversations: [],
  isLoadingConversations: false,
  typingUsers: {},
  onlineUsers: {},
  error: null,

  fetchChannelMessages: async (channelId, limit = 50, cursor) => {
    try {
      set({ isLoadingMessages: true, error: null });
      
      const response = await apiClient.get(`/messages/channel/${channelId}?limit=${limit}${cursor ? `&cursor=${cursor}` : ''}`);
      
      if (response.success) {
        const messages = response.data.messages;
        set(state => ({
          channelMessages: {
            ...state.channelMessages,
            [channelId]: cursor 
              ? [...messages, ...(state.channelMessages[channelId] || [])]
              : messages,
          },
          isLoadingMessages: false,
        }));
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch messages';
      set({
        error: errorMessage,
        isLoadingMessages: false,
      });
    }
  },

  sendMessage: async (channelId, content) => {
    try {
      // Send via Socket.IO for real-time delivery
      socketManager.sendMessage(channelId, content);
      
      // Also send via HTTP as backup
      await apiClient.post(`/messages/channel/${channelId}`, { content });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send message';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  editMessage: async (messageId, content) => {
    try {
      // Send via Socket.IO for real-time delivery
      socketManager.editMessage(messageId, content);
      
      // Also send via HTTP as backup
      await apiClient.put(`/messages/${messageId}`, { content });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to edit message';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  deleteMessage: async (messageId) => {
    try {
      // Send via Socket.IO for real-time delivery
      socketManager.deleteMessage(messageId);
      
      // Also send via HTTP as backup
      await apiClient.delete(`/messages/${messageId}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete message';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  fetchConversations: async () => {
    try {
      set({ isLoadingConversations: true, error: null });
      
      const response = await apiClient.get('/messages/direct/conversations');
      
      if (response.success) {
        set({
          conversations: response.data.conversations,
          isLoadingConversations: false,
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch conversations';
      set({
        error: errorMessage,
        isLoadingConversations: false,
      });
    }
  },

  fetchDirectMessages: async (otherUserId, limit = 50, cursor) => {
    try {
      set({ isLoadingMessages: true, error: null });
      
      const response = await apiClient.get(`/messages/direct/${otherUserId}?limit=${limit}${cursor ? `&cursor=${cursor}` : ''}`);
      
      if (response.success) {
        const messages = response.data.messages;
        const conversationId = [otherUserId].sort().join(':'); // Create consistent conversation ID
        
        set(state => ({
          directMessages: {
            ...state.directMessages,
            [conversationId]: cursor 
              ? [...messages, ...(state.directMessages[conversationId] || [])]
              : messages,
          },
          isLoadingMessages: false,
        }));
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch direct messages';
      set({
        error: errorMessage,
        isLoadingMessages: false,
      });
    }
  },

  sendDirectMessage: async (receiverId, content) => {
    try {
      // Send via Socket.IO for real-time delivery
      socketManager.sendDirectMessage(receiverId, content);
      
      // Also send via HTTP as backup
      await apiClient.post(`/messages/direct/${receiverId}`, { content });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send direct message';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  markDirectMessagesAsRead: async (otherUserId) => {
    try {
      await apiClient.put(`/messages/direct/${otherUserId}/read`);
      
      // Update local state to mark messages as read
      const conversationId = [otherUserId].sort().join(':');
      set(state => ({
        directMessages: {
          ...state.directMessages,
          [conversationId]: state.directMessages[conversationId]?.map(msg => 
            msg.receiverId === state.directMessages[conversationId][0]?.senderId 
              ? { ...msg, isRead: true }
              : msg
          ) || [],
        },
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to mark messages as read';
      set({ error: errorMessage });
    }
  },

  addMessage: (message) => {
    set(state => ({
      channelMessages: {
        ...state.channelMessages,
        [message.channelId!]: [
          ...(state.channelMessages[message.channelId!] || []),
          message,
        ],
      },
    }));
  },

  updateMessage: (message) => {
    set(state => ({
      channelMessages: {
        ...state.channelMessages,
        [message.channelId!]: state.channelMessages[message.channelId!]?.map(msg =>
          msg.id === message.id ? message : msg
        ) || [],
      },
    }));
  },

  removeMessage: (messageId) => {
    set(state => {
      const newChannelMessages = { ...state.channelMessages };
      
      // Find and remove message from appropriate channel
      Object.keys(newChannelMessages).forEach(channelId => {
        newChannelMessages[channelId] = newChannelMessages[channelId].filter(
          msg => msg.id !== messageId
        );
      });
      
      return { channelMessages: newChannelMessages };
    });
  },

  addDirectMessage: (message) => {
    const conversationId = [message.senderId, message.receiverId].sort().join(':');
    
    set(state => ({
      directMessages: {
        ...state.directMessages,
        [conversationId]: [
          ...(state.directMessages[conversationId] || []),
          message,
        ],
      },
    }));
  },

  setUserTyping: (channelId, userId) => {
    set(state => ({
      typingUsers: {
        ...state.typingUsers,
        [channelId]: new Set([...(state.typingUsers[channelId] || []), userId]),
      },
    }));
  },

  setUserStoppedTyping: (channelId, userId) => {
    set(state => {
      const newTypingUsers = { ...state.typingUsers };
      if (newTypingUsers[channelId]) {
        newTypingUsers[channelId] = new Set(newTypingUsers[channelId]);
        newTypingUsers[channelId].delete(userId);
        
        if (newTypingUsers[channelId].size === 0) {
          delete newTypingUsers[channelId];
        }
      }
      
      return { typingUsers: newTypingUsers };
    });
  },

  setUserOnline: (channelId, userId) => {
    set(state => ({
      onlineUsers: {
        ...state.onlineUsers,
        [channelId]: new Set([...(state.onlineUsers[channelId] || []), userId]),
      },
    }));
  },

  setUserOffline: (channelId, userId) => {
    set(state => {
      const newOnlineUsers = { ...state.onlineUsers };
      if (newOnlineUsers[channelId]) {
        newOnlineUsers[channelId] = new Set(newOnlineUsers[channelId]);
        newOnlineUsers[channelId].delete(userId);
        
        if (newOnlineUsers[channelId].size === 0) {
          delete newOnlineUsers[channelId];
        }
      }
      
      return { onlineUsers: newOnlineUsers };
    });
  },

  clearError: () => set({ error: null }),
}));