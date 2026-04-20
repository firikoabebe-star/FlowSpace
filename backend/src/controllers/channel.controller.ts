import { Request, Response, NextFunction } from 'express';
import { ChannelService } from '../services/channel.service';
import { BadRequestError } from '../utils/errors';

const channelService = new ChannelService();

export class ChannelController {
  async createChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const { workspaceId } = req.params;
      const { name, description, isPrivate } = req.body;
      const userId = req.user?.userId;

      if (!name) {
        throw new BadRequestError('Channel name is required');
      }

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const channel = await channelService.createChannel(workspaceId, userId, {
        name,
        description,
        isPrivate,
      });

      res.status(201).json({
        success: true,
        data: { channel },
      });
    } catch (error) {
      next(error);
    }
  }

  async getChannelById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const channel = await channelService.getChannelById(id, userId);

      res.json({
        success: true,
        data: { channel },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, description, isPrivate } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const channel = await channelService.updateChannel(id, userId, {
        name,
        description,
        isPrivate,
      });

      res.json({
        success: true,
        data: { channel },
        message: 'Channel updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      await channelService.deleteChannel(id, userId);

      res.json({
        success: true,
        message: 'Channel deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async joinChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const channel = await channelService.joinChannel(id, userId);

      res.json({
        success: true,
        data: { channel },
        message: 'Successfully joined channel',
      });
    } catch (error) {
      next(error);
    }
  }

  async leaveChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      await channelService.leaveChannel(id, userId);

      res.json({
        success: true,
        message: 'Successfully left channel',
      });
    } catch (error) {
      next(error);
    }
  }

  async addMemberToChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { userId: targetUserId } = req.body;
      const userId = req.user?.userId;

      if (!targetUserId) {
        throw new BadRequestError('Target user ID is required');
      }

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const channel = await channelService.addMemberToChannel(id, targetUserId, userId);

      res.json({
        success: true,
        data: { channel },
        message: 'Member added to channel successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}