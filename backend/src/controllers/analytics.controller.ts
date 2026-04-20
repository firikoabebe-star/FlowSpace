import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { BadRequestError, ForbiddenError } from '../utils/errors';
import prisma from '../db/prisma';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  async getWorkspaceStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { workspaceId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      // Check if user has access to workspace
      const workspaceMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId,
          },
        },
      });

      if (!workspaceMember) {
        throw new ForbiddenError('You do not have access to this workspace');
      }

      const stats = await analyticsService.getWorkspaceStats(workspaceId);

      res.json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMessageTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const { workspaceId } = req.params;
      const { days = '7' } = req.query;
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      // Check workspace access
      const workspaceMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId,
          },
        },
      });

      if (!workspaceMember) {
        throw new ForbiddenError('You do not have access to this workspace');
      }

      const trends = await analyticsService.getMessageTrends(
        workspaceId,
        parseInt(days as string)
      );

      res.json({
        success: true,
        data: { trends },
      });
    } catch (error) {
      next(error);
    }
  }

  async getChannelStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { channelId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      // Check channel access
      const channel = await prisma.channel.findUnique({
        where: { id: channelId },
      });

      if (!channel) {
        throw new BadRequestError('Channel not found');
      }

      // Check workspace membership
      const workspaceMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: channel.workspaceId,
            userId,
          },
        },
      });

      if (!workspaceMember) {
        throw new ForbiddenError('You do not have access to this channel');
      }

      // For private channels, check channel membership
      if (channel.isPrivate) {
        const channelMember = await prisma.channelMember.findUnique({
          where: {
            channelId_userId: {
              channelId,
              userId,
            },
          },
        });

        if (!channelMember) {
          throw new ForbiddenError('You do not have access to this private channel');
        }
      }

      const stats = await analyticsService.getChannelStats(channelId);

      res.json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserEngagement(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const engagement = await analyticsService.getUserEngagement(userId);

      res.json({
        success: true,
        data: { engagement },
      });
    } catch (error) {
      next(error);
    }
  }

  async getSystemStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      // Check if user is system admin (you might want to implement proper admin roles)
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      // For now, we'll allow any authenticated user to see system stats
      // In production, you'd want proper admin role checking
      if (!user) {
        throw new ForbiddenError('Access denied');
      }

      const stats = await analyticsService.getSystemStats();

      res.json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      next(error);
    }
  }

  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      // Check if user is system admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new ForbiddenError('Access denied');
      }

      const {
        page = '1',
        limit = '50',
        action,
        userId: filterUserId,
        startDate,
        endDate,
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const where: any = {};

      if (action) {
        where.action = {
          contains: action as string,
          mode: 'insensitive',
        };
      }

      if (filterUserId) {
        where.userId = filterUserId as string;
      }

      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) {
          where.timestamp.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.timestamp.lte = new Date(endDate as string);
        }
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
          orderBy: {
            timestamp: 'desc',
          },
          skip: offset,
          take: limitNum,
        }),
        prisma.auditLog.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          logs,
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}