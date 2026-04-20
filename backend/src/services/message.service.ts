import prisma from '../db/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors';

export class MessageService {
  async createMessage(
    userId: string,
    channelId: string,
    content: string
  ): Promise<any> {
    // Check if user has access to the channel
    const hasAccess = await this.checkChannelAccess(channelId, userId);
    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this channel');
    }

    const message = await prisma.message.create({
      data: {
        content,
        userId,
        channelId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        file: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return message;
  }

  async searchChannelMessages(
    channelId: string,
    userId: string,
    query: string,
    limit = 50
  ): Promise<any> {
    // Check if user has access to the channel
    const hasAccess = await this.checkChannelAccess(channelId, userId);
    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this channel');
    }

    const messages = await prisma.message.findMany({
      where: {
        channelId,
        isDeleted: false,
        content: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        file: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return messages;
  }

  async getChannelMessages(
    channelId: string,
    userId: string,
    limit = 50,
    cursor?: string
  ): Promise<any> {
    // Check if user has access to the channel
    const hasAccess = await this.checkChannelAccess(channelId, userId);
    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this channel');
    }

    const messages = await prisma.message.findMany({
      where: {
        channelId,
        isDeleted: false,
        ...(cursor && {
          createdAt: {
            lt: new Date(cursor),
          },
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        file: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return messages.reverse(); // Return in chronological order
  }

  async updateMessage(
    messageId: string,
    userId: string,
    content: string
  ): Promise<any> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    if (message.userId !== userId) {
      throw new ForbiddenError('You can only edit your own messages');
    }

    if (message.isDeleted) {
      throw new BadRequestError('Cannot edit deleted message');
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return updatedMessage;
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    if (message.userId !== userId) {
      throw new ForbiddenError('You can only delete your own messages');
    }

    await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        content: '[Message deleted]',
        updatedAt: new Date(),
      },
    });
  }

  async createDirectMessage(
    senderId: string,
    receiverId: string,
    content: string
  ): Promise<any> {
    if (senderId === receiverId) {
      throw new BadRequestError('Cannot send message to yourself');
    }

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      throw new NotFoundError('Receiver not found');
    }

    const directMessage = await prisma.directMessage.create({
      data: {
        content,
        senderId,
        receiverId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return directMessage;
  }

  async getDirectMessages(
    userId: string,
    otherUserId: string,
    limit = 50,
    cursor?: string
  ): Promise<any> {
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
        isDeleted: false,
        ...(cursor && {
          createdAt: {
            lt: new Date(cursor),
          },
        }),
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return messages.reverse();
  }

  async getDirectMessageConversations(userId: string): Promise<any> {
    // Get all direct messages where user is sender or receiver
    const conversations = await prisma.directMessage.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        isDeleted: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group by conversation partner and get latest message
    const conversationMap = new Map();
    
    conversations.forEach((message) => {
      const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
      const partner = message.senderId === userId ? message.receiver : message.sender;
      
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          partner,
          lastMessage: message,
          unreadCount: 0,
        });
      }
      
      // Count unread messages (messages sent to current user that are not read)
      if (message.receiverId === userId && !message.isRead) {
        conversationMap.get(partnerId).unreadCount++;
      }
    });

    return Array.from(conversationMap.values());
  }

  async markDirectMessagesAsRead(userId: string, otherUserId: string): Promise<void> {
    await prisma.directMessage.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  private async checkChannelAccess(channelId: string, userId: string): Promise<boolean> {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return false;
    }

    // Check if user is a member of the workspace
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: channel.workspaceId,
          userId,
        },
      },
    });

    if (!workspaceMember) {
      return false;
    }

    // If channel is public, workspace membership is enough
    if (!channel.isPrivate) {
      return true;
    }

    // If channel is private, check channel membership
    const channelMember = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    return !!channelMember;
  }
}