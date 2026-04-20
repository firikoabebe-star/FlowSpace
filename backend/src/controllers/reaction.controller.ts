import { Request, Response, NextFunction } from 'express';
import { ReactionService } from '../services/reaction.service';
import { BadRequestError } from '../utils/errors';

const reactionService = new ReactionService();

export class ReactionController {
  async addReaction(req: Request, res: Response, next: NextFunction) {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      if (!emoji) {
        throw new BadRequestError('Emoji is required');
      }

      const reaction = await reactionService.addReaction(messageId, userId, emoji);

      res.status(201).json({
        success: true,
        data: { reaction },
      });
    } catch (error) {
      next(error);
    }
  }

  async removeReaction(req: Request, res: Response, next: NextFunction) {
    try {
      const { messageId, emoji } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      await reactionService.removeReaction(messageId, userId, emoji);

      res.json({
        success: true,
        message: 'Reaction removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getMessageReactions(req: Request, res: Response, next: NextFunction) {
    try {
      const { messageId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const reactions = await reactionService.getMessageReactions(messageId, userId);

      res.json({
        success: true,
        data: { reactions },
      });
    } catch (error) {
      next(error);
    }
  }
}