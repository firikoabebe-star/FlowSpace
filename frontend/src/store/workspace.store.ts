import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Workspace, Channel } from '@/types';
import { apiClient } from '@/lib/api';

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  channels: Channel[];
  currentChannel: Channel | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchWorkspaces: () => Promise<void>;
  createWorkspace: (data: { name: string; slug?: string }) => Promise<Workspace>;
  selectWorkspace: (slug: string) => Promise<void>;
  joinWorkspace: (inviteCode: string) => Promise<void>;
  updateWorkspace: (id: string, data: { name?: string; description?: string }) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  
  // Channel actions
  createChannel: (workspaceId: string, data: { name: string; description?: string; isPrivate?: boolean }) => Promise<Channel>;
  selectChannel: (channelId: string) => Promise<void>;
  updateChannel: (channelId: string, data: { name?: string; description?: string; isPrivate?: boolean }) => Promise<void>;
  deleteChannel: (channelId: string) => Promise<void>;
  joinChannel: (channelId: string) => Promise<void>;
  leaveChannel: (channelId: string) => Promise<void>;
  
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      currentWorkspace: null,
      channels: [],
      currentChannel: null,
      isLoading: false,
      error: null,

      fetchWorkspaces: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await apiClient.get('/workspaces');
          
          if (response.success) {
            set({
              workspaces: response.data.workspaces,
              isLoading: false,
            });
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch workspaces';
          set({
            error: errorMessage,
            isLoading: false,
          });
        }
      },

      createWorkspace: async (data) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await apiClient.post('/workspaces', data);
          
          if (response.success) {
            const newWorkspace = response.data.workspace;
            set(state => ({
              workspaces: [...state.workspaces, newWorkspace],
              isLoading: false,
            }));
            return newWorkspace;
          }
          throw new Error('Failed to create workspace');
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to create workspace';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      selectWorkspace: async (slug) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await apiClient.get(`/workspaces/${slug}`);
          
          if (response.success) {
            const workspace = response.data.workspace;
            set({
              currentWorkspace: workspace,
              channels: workspace.channels || [],
              isLoading: false,
            });
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch workspace';
          set({
            error: errorMessage,
            isLoading: false,
          });
        }
      },

      joinWorkspace: async (inviteCode) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await apiClient.post('/workspaces/join', { inviteCode });
          
          if (response.success) {
            const workspace = response.data.workspace;
            set(state => ({
              workspaces: [...state.workspaces, workspace],
              currentWorkspace: workspace,
              channels: workspace.channels || [],
              isLoading: false,
            }));
            
            // Navigate to the workspace
            window.location.href = `/workspace/${workspace.slug}`;
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to join workspace';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      updateWorkspace: async (id, data) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await apiClient.put(`/workspaces/${id}`, data);
          
          if (response.success) {
            const updatedWorkspace = response.data.workspace;
            set(state => ({
              workspaces: state.workspaces.map(w => w.id === id ? updatedWorkspace : w),
              currentWorkspace: state.currentWorkspace?.id === id ? updatedWorkspace : state.currentWorkspace,
              isLoading: false,
            }));
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to update workspace';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      deleteWorkspace: async (id) => {
        try {
          set({ isLoading: true, error: null });
          
          await apiClient.delete(`/workspaces/${id}`);
          
          set(state => ({
            workspaces: state.workspaces.filter(w => w.id !== id),
            currentWorkspace: state.currentWorkspace?.id === id ? null : state.currentWorkspace,
            channels: state.currentWorkspace?.id === id ? [] : state.channels,
            isLoading: false,
          }));
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to delete workspace';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      createChannel: async (workspaceId, data) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await apiClient.post(`/channels/workspace/${workspaceId}`, data);
          
          if (response.success) {
            const newChannel = response.data.channel;
            set(state => ({
              channels: [...state.channels, newChannel],
              isLoading: false,
            }));
            return newChannel;
          }
          throw new Error('Failed to create channel');
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to create channel';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      selectChannel: async (channelId) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await apiClient.get(`/channels/${channelId}`);
          
          if (response.success) {
            set({
              currentChannel: response.data.channel,
              isLoading: false,
            });
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch channel';
          set({
            error: errorMessage,
            isLoading: false,
          });
        }
      },

      updateChannel: async (channelId, data) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await apiClient.put(`/channels/${channelId}`, data);
          
          if (response.success) {
            const updatedChannel = response.data.channel;
            set(state => ({
              channels: state.channels.map(c => c.id === channelId ? updatedChannel : c),
              currentChannel: state.currentChannel?.id === channelId ? updatedChannel : state.currentChannel,
              isLoading: false,
            }));
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to update channel';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      deleteChannel: async (channelId) => {
        try {
          set({ isLoading: true, error: null });
          
          await apiClient.delete(`/channels/${channelId}`);
          
          set(state => ({
            channels: state.channels.filter(c => c.id !== channelId),
            currentChannel: state.currentChannel?.id === channelId ? null : state.currentChannel,
            isLoading: false,
          }));
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to delete channel';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      joinChannel: async (channelId) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await apiClient.post(`/channels/${channelId}/join`);
          
          if (response.success) {
            const channel = response.data.channel;
            set(state => ({
              channels: state.channels.some(c => c.id === channelId) 
                ? state.channels.map(c => c.id === channelId ? channel : c)
                : [...state.channels, channel],
              isLoading: false,
            }));
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to join channel';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      leaveChannel: async (channelId) => {
        try {
          set({ isLoading: true, error: null });
          
          await apiClient.post(`/channels/${channelId}/leave`);
          
          set(state => ({
            channels: state.channels.filter(c => c.id !== channelId),
            currentChannel: state.currentChannel?.id === channelId ? null : state.currentChannel,
            isLoading: false,
          }));
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to leave channel';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      clearError: () => set({ error: null }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({
        currentWorkspace: state.currentWorkspace,
        currentChannel: state.currentChannel,
      }),
    }
  )
);