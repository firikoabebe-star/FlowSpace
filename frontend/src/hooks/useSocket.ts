import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useMessageStore } from '@/store/message.store';
import { socketManager } from '@/lib/socket';

export function useSocket() {
  const { user, isAuthenticated } = useAuthStore();
  const { 
    addMessage, 
    updateMessage, 
    removeMessage, 
    addDirectMessage,
    setUserTyping,
    setUserStoppedTyping,
    setUserOnline,
    setUserOffline,
  } = useMessageStore();
  
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user || isInitialized.current) {
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      return;
    }

    // Connect to socket
    const socket = socketManager.connect(token);
    isInitialized.current = true;

    // Set up event listeners
    socketManager.onNewMessage((message) => {
      addMessage(message);
    });

    socketManager.onMessageUpdated((message) => {
      updateMessage(message);
    });

    socketManager.onMessageDeleted((data) => {
      removeMessage(data.messageId);
    });

    socketManager.onNewDirectMessage((message) => {
      addDirectMessage(message);
    });

    socketManager.onTypingStart((data) => {
      setUserTyping(data.channelId, data.userId);
    });

    socketManager.onTypingStop((data) => {
      setUserStoppedTyping(data.channelId, data.userId);
    });

    socketManager.onUserOnline((data) => {
      setUserOnline(data.channelId, data.userId);
    });

    socketManager.onUserOffline((data) => {
      setUserOffline(data.channelId, data.userId);
    });

    // Cleanup on unmount
    return () => {
      socketManager.disconnect();
      isInitialized.current = false;
    };
  }, [isAuthenticated, user, addMessage, updateMessage, removeMessage, addDirectMessage, setUserTyping, setUserStoppedTyping, setUserOnline, setUserOffline]);

  return {
    connected: socketManager.connected,
    socketId: socketManager.id,
  };
}