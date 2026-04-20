import prisma from '../db/prisma';
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from '../utils/errors';
import { WorkspaceRole } from '../types';

export class ChannelService {
  async createChannel(
    workspaceId: string,
    userId: string,
    data: { name: string; description?: string; isPrivate?: boolean }
  ): Promise<any> {
    // Check if user is a member of the workspace
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenError('You are not a member of this workspace');
    }

    // Check if channel name already exists in workspace
    const existingChannel = await prisma.channel.findUnique({
      where: {
        workspaceId_name: {
          workspaceId,
          name: data.name,
        },
      },
    });

    if (existingChannel) {
      throw new ConflictError('Channel name already exists in this workspace');
    }

    const channel = await prisma.channel.create({
      data: {
        name: data.name,
        description: data.description,
        workspaceId,
        isPrivate: data.isPrivate || false,
        members: {
          create: {
            userId,
          },
        },
      },
      include: {
        members: {
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
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    return channel;
  }

  async getChannelById(channelId: string, userId: string): Promise<any> {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        members: {
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
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    if (!channel) {
      throw new NotFoundError('Channel not found');
    }

    // Check if user has access to this channel
    const hasAccess = await this.checkChannelAccess(channelId, userId);
    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this channel');
    }

    return channel;
  }

  async updateChannel(
    channelId: string,
    userId: string,
    data: { name?: string; description?: string; isPrivate?: boolean }
  ): Promise<any> {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        workspace: true,
      },
    });

    if (!channel) {
      throw new NotFoundError('Channel not found');
    }

    // Check if user has permission to update channel
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: channel.workspaceId,
          userId,
        },
      },
    });

    if (!member || (member.role !== WorkspaceRole.OWNER && member.role !== WorkspaceRole.ADMIN)) {
      throw new ForbiddenError('You do not have permission to update this channel');
    }

    // If changing name, check for conflicts
    if (data.name && data.name !== channel.name) {
      const existingChannel = await prisma.channel.findUnique({
        where: {
          workspaceId_name: {
            workspaceId: channel.workspaceId,
            name: data.name,
          },
        },
      });

      if (existingChannel) {
        throw new ConflictError('Channel name already exists in this workspace');
      }
    }

    const updatedChannel = await prisma.channel.update({
      where: { id: channelId },
      data,
      include: {
        members: {
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
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    return updatedChannel;
  }

  async deleteChannel(channelId: string, userId: string): Promise<void> {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundError('Channel not found');
    }

    // Prevent deletion of general channel
    if (channel.name === 'general') {
      throw new BadRequestError('Cannot delete the general channel');
    }

    // Check if user has permission to delete channel
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: channel.workspaceId,
          userId,
        },
      },
    });

    if (!member || (member.role !== WorkspaceRole.OWNER && member.role !== WorkspaceRole.ADMIN)) {
      throw new ForbiddenError('You do not have permission to delete this channel');
    }

    await prisma.channel.delete({
      where: { id: channelId },
    });
  }

  async joinChannel(channelId: string, userId: string): Promise<any> {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundError('Channel not found');
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
      throw new ForbiddenError('You are not a member of this workspace');
    }

    // Check if channel is private
    if (channel.isPrivate) {
      throw new ForbiddenError('Cannot join private channel without invitation');
    }

    // Check if user is already a member
    const existingMember = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictError('You are already a member of this channel');
    }

    await prisma.channelMember.create({
      data: {
        channelId,
        userId,
      },
    });

    return this.getChannelById(channelId, userId);
  }

  async leaveChannel(channelId: string, userId: string): Promise<void> {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundError('Channel not found');
    }

    // Prevent leaving general channel
    if (channel.name === 'general') {
      throw new BadRequestError('Cannot leave the general channel');
    }

    const member = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    if (!member) {
      throw new NotFoundError('You are not a member of this channel');
    }

    await prisma.channelMember.delete({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });
  }

  async addMemberToChannel(channelId: string, targetUserId: string, userId: string): Promise<any> {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundError('Channel not found');
    }

    // Check if requesting user has permission
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: channel.workspaceId,
          userId,
        },
      },
    });

    if (!member || (member.role !== WorkspaceRole.OWNER && member.role !== WorkspaceRole.ADMIN)) {
      throw new ForbiddenError('You do not have permission to add members to this channel');
    }

    // Check if target user is a member of the workspace
    const targetMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: channel.workspaceId,
          userId: targetUserId,
        },
      },
    });

    if (!targetMember) {
      throw new BadRequestError('Target user is not a member of this workspace');
    }

    // Check if target user is already a channel member
    const existingChannelMember = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId: targetUserId,
        },
      },
    });

    if (existingChannelMember) {
      throw new ConflictError('User is already a member of this channel');
    }

    await prisma.channelMember.create({
      data: {
        channelId,
        userId: targetUserId,
      },
    });

    return this.getChannelById(channelId, userId);
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