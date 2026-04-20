import { Request, Response, NextFunction } from 'express';
import { MessageService } from '../services/message.service';
import { BadRequestError } from '../utils/errors';

const messageService = new MessageService();

export class MessageController {
  async getChannelMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { channelId } = req.params;
      const { limit = '50', cursor } = req.query;
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const messages = await messageService.getChannelMessages(
        channelId,
        userId,
        parseInt(limit as string),
        cursor as string
      );

      res.json({
        success: true,
        data: { messages },
      });
    } catch (error) {
      next(error);
    }
  }

  async searchChannelMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { channelId } = req.params;
      const { query, limit = '50' } = req.query;
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      if (!query || typeof query !== 'string' || !query.trim()) {
        throw new BadRequestError('Search query is required');
      }

      const messages = await messageService.searchChannelMessages(
        channelId,
        userId,
        query.trim(),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: { messages, query: query.trim() },
      });
    } catch (error) {
      next(error);
    }
  }

  async createMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { channelId } = req.params;
      const { content } = req.body;
      const userId = req.user?.userId;

      if (!content || !content.trim()) {
        throw new BadRequestError('Message content is required');
      }

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const message = await messageService.createMessage(userId, channelId, content.trim());

      res.status(201).json({
        success: true,
        data: { message },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { messageId } = req.params;
      const { content } = req.body;
      const userId = req.user?.userId;

      if (!content || !content.trim()) {
        throw new BadRequestError('Message content is required');
      }

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const message = await messageService.updateMessage(messageId, userId, content.trim());

      res.json({
        success: true,
        data: { message },
        message: 'Message updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { messageId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      await messageService.deleteMessage(messageId, userId);

      res.json({
        success: true,
        message: 'Message deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getDirectMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { otherUserId } = req.params;
      const { limit = '50', cursor } = req.query;
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const messages = await messageService.getDirectMessages(
        userId,
        otherUserId,
        parseInt(limit as string),
        cursor as string
      );

      res.json({
        success: true,
        data: { messages },
      });
    } catch (error) {
      next(error);
    }
  }

  async createDirectMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { receiverId } = req.params;
      const { content } = req.body;
      const userId = req.user?.userId;

      if (!content || !content.trim()) {
        throw new BadRequestError('Message content is required');
      }

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const directMessage = await messageService.createDirectMessage(
        userId,
        receiverId,
        content.trim()
      );

      res.status(201).json({
        success: true,
        data: { message: directMessage },
      });
    } catch (error) {
      next(error);
    }
  }

  async getDirectMessageConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const conversations = await messageService.getDirectMessageConversations(userId);

      res.json({
        success: true,
        data: { conversations },
      });
    } catch (error) {
      next(error);
    }
  }

  async markDirectMessagesAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { otherUserId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      await messageService.markDirectMessagesAsRead(userId, otherUserId);

      res.json({
        success: true,
        message: 'Messages marked as read',
      });
    } catch (error) {
      next(error);
    }
  }
}