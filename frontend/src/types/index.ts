export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
  userRole?: WorkspaceRole;
  channels?: Channel[];
  members?: WorkspaceMember[];
  _count?: {
    members: number;
  };
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  members?: ChannelMember[];
  _count?: {
    messages: number;
  };
}

export interface ChannelMember {
  id: string;
  channelId: string;
  userId: string;
  createdAt: string;
  user?: User;
}

export interface Message {
  id: string;
  content: string;
  userId: string;
  channelId?: string;
  fileId?: string;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
  file?: FileAttachment;
  reactions?: MessageReaction[];
}

export interface FileAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadedById: string;
  channelId?: string;
  createdAt: string;
  updatedAt: string;
  uploadedBy: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
  user?: User;
}

export interface DirectMessage {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  isEdited: boolean;
  isDeleted: boolean;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  sender?: User;
  receiver?: User;
}

export enum WorkspaceRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER'
}

export interface AuthTokens {
  accessToken: string;
}

export interface LoginCredentials {
  emailOrUsername: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  displayName: string;
  password: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}