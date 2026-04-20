import prisma from '../db/prisma';
import { logger } from '../utils/logger';

export enum AuditAction {
  USER_REGISTER = 'USER_REGISTER',
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  WORKSPACE_CREATE = 'WORKSPACE_CREATE',
  WORKSPACE_UPDATE = 'WORKSPACE_UPDATE',
  WORKSPACE_DELETE = 'WORKSPACE_DELETE',
  WORKSPACE_JOIN = 'WORKSPACE_JOIN',
  WORKSPACE_LEAVE = 'WORKSPACE_LEAVE',
  CHANNEL_CREATE = 'CHANNEL_CREATE',
  CHANNEL_UPDATE = 'CHANNEL_UPDATE',
  CHANNEL_DELETE = 'CHANNEL_DELETE',
  CHANNEL_JOIN = 'CHANNEL_JOIN',
  CHANNEL_LEAVE = 'CHANNEL_LEAVE',
  MESSAGE_SEND = 'MESSAGE_SEND',
  MESSAGE_EDIT = 'MESSAGE_EDIT',
  MESSAGE_DELETE = 'MESSAGE_DELETE',
  FILE_UPLOAD = 'FILE_UPLOAD',
  FILE_DOWNLOAD = 'FILE_DOWNLOAD',
  FILE_DELETE = 'FILE_DELETE',
  PERMISSION_GRANT = 'PERMISSION_GRANT',
  PERMISSION_REVOKE = 'PERMISSION_REVOKE',
}

interface AuditLogData {
  action: string;
  userId?: string;
  workspaceId?: string;
  channelId?: string;
  resourceId?: string;
  resourceType?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  async log(data: AuditLogData): Promise<void> {
    try {
      // Log to database
      await prisma.auditLog.create({
        data: {
          action: data.action,
          userId: data.userId,
          workspaceId: data.workspaceId,
          channelId: data.channelId,
          resourceId: data.resourceId,
          resourceType: data.resourceType,
          metadata: data.metadata || {},
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          timestamp: new Date(),
        },
      });

      // Also log to application logger for immediate monitoring
      logger.info('Audit Log', {
        action: data.action,
        userId: data.userId,
        workspaceId: data.workspaceId,
        resourceId: data.resourceId,
        ipAddress: data.ipAddress,
      });
    } catch (error) {
      // Don't fail the main operation if audit logging fails
      logger.error('Failed to create audit log', error);
    }
  }

  async getUserActivity(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<any[]> {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });
  }

  async getWorkspaceActivity(
    workspaceId: string,
    limit = 100,
    offset = 0
  ): Promise<any[]> {
    return prisma.auditLog.findMany({
      where: { workspaceId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });
  }

  async getSecurityEvents(
    timeframe: 'hour' | 'day' | 'week' = 'day'
  ): Promise<any[]> {
    const now = new Date();
    const timeMap = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
    };

    const since = new Date(now.getTime() - timeMap[timeframe]);

    return prisma.auditLog.findMany({
      where: {
        timestamp: { gte: since },
        action: {
          in: [
            AuditAction.USER_LOGIN,
            AuditAction.USER_LOGOUT,
            AuditAction.PERMISSION_GRANT,
            AuditAction.PERMISSION_REVOKE,
          ],
        },
      },
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });
  }

  async getActivityStats(workspaceId?: string): Promise<any> {
    const where = workspaceId ? { workspaceId } : {};
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [todayCount, weekCount, totalCount] = await Promise.all([
      prisma.auditLog.count({
        where: { ...where, timestamp: { gte: dayAgo } },
      }),
      prisma.auditLog.count({
        where: { ...where, timestamp: { gte: weekAgo } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      today: todayCount,
      week: weekCount,
      total: totalCount,
    };
  }
}

// Export singleton instance
export const auditService = new AuditService();