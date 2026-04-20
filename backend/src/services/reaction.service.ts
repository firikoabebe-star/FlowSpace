import prisma from '../db/prisma';
import { NotFoundError, BadRequestError } from '../utils/errors';

export class ReactionService {
  async addReaction(messageId: string, userId: string, emoji: string): Promise<any> {
    // Check if message exists and user has access
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        channel: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Check if user has access to the channel
    const hasAccess = await this.checkChannelAccess(message.channelId, userId);
    if (!hasAccess) {
      throw new BadRequestError('You do not have access to this message');
    }

    // Check if reaction already exists
    const existingReaction = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
    });

    if (existingReaction) {
      throw new BadRequestError('You have already reacted with this emoji');
    }

    // Create reaction
    const reaction = await prisma.messageReaction.create({
      data: {
        messageId,
        userId,
        emoji,
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

    return reaction;
  }

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    // Check if message exists and user has access
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        channel: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Check if user has access to the channel
    const hasAccess = await this.checkChannelAccess(message.channelId, userId);
    if (!hasAccess) {
      throw new BadRequestError('You do not have access to this message');
    }

    // Find and delete reaction
    const reaction = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
    });

    if (!reaction) {
      throw new NotFoundError('Reaction not found');
    }

    await prisma.messageReaction.delete({
      where: { id: reaction.id },
    });
  }

  async getMessageReactions(messageId: string, userId: string): Promise<any[]> {
    // Check if message exists and user has access
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        channel: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Check if user has access to the channel
    const hasAccess = await this.checkChannelAccess(message.channelId, userId);
    if (!hasAccess) {
      throw new BadRequestError('You do not have access to this message');
    }

    // Get reactions grouped by emoji
    const reactions = await prisma.messageReaction.findMany({
      where: { messageId },
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
      orderBy: { createdAt: 'asc' },
    });

    // Group reactions by emoji
    const groupedReactions = reactions.reduce((acc: any, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
          userReacted: false,
        };
      }
      
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.user);
      
      if (reaction.userId === userId) {
        acc[reaction.emoji].userReacted = true;
      }
      
      return acc;
    }, {});

    return Object.values(groupedReactions);
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