import { Request, Response, NextFunction } from 'express';
import { FileService } from '../services/file.service';
import { BadRequestError } from '../utils/errors';
import path from 'path';

const fileService = new FileService();

export class FileController {
  async uploadFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { channelId } = req.body;
      const userId = req.user?.userId;
      const file = req.file;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      if (!file) {
        throw new BadRequestError('No file provided');
      }

      const fileRecord = await fileService.uploadFile(userId, file, channelId);

      res.status(201).json({
        success: true,
        data: { file: fileRecord },
      });
    } catch (error) {
      next(error);
    }
  }

  async getFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { fileId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const file = await fileService.getFile(fileId, userId);

      res.json({
        success: true,
        data: { file },
      });
    } catch (error) {
      next(error);
    }
  }

  async downloadFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { fileId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const file = await fileService.getFile(fileId, userId);

      // Set appropriate headers
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
      res.setHeader('Content-Type', file.mimetype);

      // Send file
      res.sendFile(path.resolve(file.path));
    } catch (error) {
      next(error);
    }
  }

  async deleteFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { fileId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      await fileService.deleteFile(fileId, userId);

      res.json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getChannelFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const { channelId } = req.params;
      const { limit = '50' } = req.query;
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const files = await fileService.getChannelFiles(
        channelId,
        userId,
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: { files },
      });
    } catch (error) {
      next(error);
    }
  }
}