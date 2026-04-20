import prisma from '../db/prisma';

export class AnalyticsService {
  async getWorkspaceStats(workspaceId: string): Promise<any> {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalMembers,
      totalChannels,
      totalMessages,
      messagesLastDay,
      messagesLastWeek,
      messagesLastMonth,
      activeUsersLastDay,
      activeUsersLastWeek,
      filesUploaded,
      filesSize,
    ] = await Promise.all([
      // Total members
      prisma.workspaceMember.count({
        where: { workspaceId },
      }),

      // Total channels
      prisma.channel.count({
        where: { workspaceId },
      }),

      // Total messages
      prisma.message.count({
        where: {
          channel: { workspaceId },
          isDeleted: false,
        },
      }),

      // Messages last day
      prisma.message.count({
        where: {
          channel: { workspaceId },
          isDeleted: false,
          createdAt: { gte: dayAgo },
        },
      }),

      // Messages last week
      prisma.message.count({
        where: {
          channel: { workspaceId },
          isDeleted: false,
          createdAt: { gte: weekAgo },
        },
      }),

      // Messages last month
      prisma.message.count({
        where: {
          channel: { workspaceId },
          isDeleted: false,
          createdAt: { gte: monthAgo },
        },
      }),

      // Active users last day
      prisma.message.findMany({
        where: {
          channel: { workspaceId },
          createdAt: { gte: dayAgo },
        },
        select: { userId: true },
        distinct: ['userId'],
      }),

      // Active users last week
      prisma.message.findMany({
        where: {
          channel: { workspaceId },
          createdAt: { gte: weekAgo },
        },
        select: { userId: true },
        distinct: ['userId'],
      }),

      // Files uploaded
      prisma.file.count({
        where: {
          channel: { workspaceId },
        },
      }),

      // Total file size
      prisma.file.aggregate({
        where: {
          channel: { workspaceId },
        },
        _sum: { size: true },
      }),
    ]);

    return {
      members: {
        total: totalMembers,
      },
      channels: {
        total: totalChannels,
      },
      messages: {
        total: totalMessages,
        lastDay: messagesLastDay,
        lastWeek: messagesLastWeek,
        lastMonth: messagesLastMonth,
      },
      activeUsers: {
        lastDay: activeUsersLastDay.length,
        lastWeek: activeUsersLastWeek.length,
      },
      files: {
        total: filesUploaded,
        totalSize: filesSize._sum.size || 0,
      },
    };
  }

  async getChannelStats(channelId: string): Promise<any> {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalMembers,
      totalMessages,
      messagesLastDay,
      messagesLastWeek,
      activeUsersLastDay,
      activeUsersLastWeek,
      topPosters,
    ] = await Promise.all([
      // Total members
      prisma.channelMember.count({
        where: { channelId },
      }),

      // Total messages
      prisma.message.count({
        where: { channelId, isDeleted: false },
      }),

      // Messages last day
      prisma.message.count({
        where: {
          channelId,
          isDeleted: false,
          createdAt: { gte: dayAgo },
        },
      }),

      // Messages last week
      prisma.message.count({
        where: {
          channelId,
          isDeleted: false,
          createdAt: { gte: weekAgo },
        },
      }),

      // Active users last day
      prisma.message.findMany({
        where: {
          channelId,
          createdAt: { gte: dayAgo },
        },
        select: { userId: true },
        distinct: ['userId'],
      }),

      // Active users last week
      prisma.message.findMany({
        where: {
          channelId,
          createdAt: { gte: weekAgo },
        },
        select: { userId: true },
        distinct: ['userId'],
      }),

      // Top message posters
      prisma.message.groupBy({
        by: ['userId'],
        where: {
          channelId,
          isDeleted: false,
          createdAt: { gte: weekAgo },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    return {
      members: {
        total: totalMembers,
      },
      messages: {
        total: totalMessages,
        lastDay: messagesLastDay,
        lastWeek: messagesLastWeek,
      },
      activeUsers: {
        lastDay: activeUsersLastDay.length,
        lastWeek: activeUsersLastWeek.length,
      },
      topPosters: topPosters.map(poster => ({
        userId: poster.userId,
        messageCount: poster._count.id,
      })),
    };
  }

  async getMessageTrends(
    workspaceId: string,
    days = 7
  ): Promise<any[]> {
    const trends = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

      const messageCount = await prisma.message.count({
        where: {
          channel: { workspaceId },
          isDeleted: false,
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      trends.push({
        date: date.toISOString().split('T')[0],
        messages: messageCount,
      });
    }

    return trends;
  }

  async getUserEngagement(userId: string): Promise<any> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      messagesLastWeek,
      messagesLastMonth,
      reactionsGiven,
      reactionsReceived,
      filesUploaded,
      channelsActive,
    ] = await Promise.all([
      // Messages sent last week
      prisma.message.count({
        where: {
          userId,
          isDeleted: false,
          createdAt: { gte: weekAgo },
        },
      }),

      // Messages sent last month
      prisma.message.count({
        where: {
          userId,
          isDeleted: false,
          createdAt: { gte: monthAgo },
        },
      }),

      // Reactions given
      prisma.messageReaction.count({
        where: {
          userId,
          createdAt: { gte: weekAgo },
        },
      }),

      // Reactions received
      prisma.messageReaction.count({
        where: {
          message: { userId },
          createdAt: { gte: weekAgo },
        },
      }),

      // Files uploaded
      prisma.file.count({
        where: {
          uploadedById: userId,
          createdAt: { gte: weekAgo },
        },
      }),

      // Channels active in
      prisma.message.findMany({
        where: {
          userId,
          createdAt: { gte: weekAgo },
        },
        select: { channelId: true },
        distinct: ['channelId'],
      }),
    ]);

    return {
      messages: {
        lastWeek: messagesLastWeek,
        lastMonth: messagesLastMonth,
      },
      reactions: {
        given: reactionsGiven,
        received: reactionsReceived,
      },
      files: {
        uploaded: filesUploaded,
      },
      engagement: {
        channelsActive: channelsActive.length,
      },
    };
  }

  async getSystemStats(): Promise<any> {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalWorkspaces,
      totalChannels,
      totalMessages,
      activeUsersToday,
      newUsersToday,
      messagesPerHour,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Total workspaces
      prisma.workspace.count(),

      // Total channels
      prisma.channel.count(),

      // Total messages
      prisma.message.count({
        where: { isDeleted: false },
      }),

      // Active users today
      prisma.message.findMany({
        where: { createdAt: { gte: dayAgo } },
        select: { userId: true },
        distinct: ['userId'],
      }),

      // New users today
      prisma.user.count({
        where: { createdAt: { gte: dayAgo } },
      }),

      // Messages per hour (last 24 hours)
      this.getMessagesPerHour(),
    ]);

    return {
      users: {
        total: totalUsers,
        activeToday: activeUsersToday.length,
        newToday: newUsersToday,
      },
      workspaces: {
        total: totalWorkspaces,
      },
      channels: {
        total: totalChannels,
      },
      messages: {
        total: totalMessages,
        perHour: messagesPerHour,
      },
    };
  }

  private async getMessagesPerHour(): Promise<any[]> {
    const hours = [];
    const now = new Date();

    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const nextHour = new Date(hour.getTime() + 60 * 60 * 1000);

      const messageCount = await prisma.message.count({
        where: {
          isDeleted: false,
          createdAt: {
            gte: hour,
            lt: nextHour,
          },
        },
      });

      hours.push({
        hour: hour.getHours(),
        messages: messageCount,
      });
    }

    return hours;
  }
}