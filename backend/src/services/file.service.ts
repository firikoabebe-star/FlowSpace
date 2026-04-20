import fs from 'fs/promises';
import path from 'path';
import prisma from '../db/prisma';
import { NotFoundError, BadRequestError } from '../utils/errors';

export class FileService {
  async uploadFile(
    userId: string,
    file: Express.Multer.File,
    channelId?: string
  ): Promise<any> {
    try {
      // Create file record in database
      const fileRecord = await prisma.file.create({
        data: {
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          uploadedById: userId,
          channelId,
        },
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
      });

      return fileRecord;
    } catch (error) {
      // Clean up file if database operation fails
      try {
        await fs.unlink(file.path);
      } catch (unlinkError) {
        console.error('Failed to clean up file:', unlinkError);
      }
      throw error;
    }
  }

  async getFile(fileId: string, userId: string): Promise<any> {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        channel: {
          include: {
            workspace: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!file) {
      throw new NotFoundError('File not found');
    }

    // Check if user has access to the file
    if (file.channelId) {
      const hasAccess = await this.checkChannelAccess(file.channelId, userId);
      if (!hasAccess) {
        throw new BadRequestError('You do not have access to this file');
      }
    }

    return file;
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundError('File not found');
    }

    // Check if user owns the file or has admin permissions
    if (file.uploadedById !== userId) {
      // TODO: Add admin permission check
      throw new BadRequestError('You can only delete your own files');
    }

    // Delete file from filesystem
    try {
      await fs.unlink(file.path);
    } catch (error) {
      console.error('Failed to delete file from filesystem:', error);
    }

    // Delete file record from database
    await prisma.file.delete({
      where: { id: fileId },
    });
  }

  async getChannelFiles(channelId: string, userId: string, limit = 50): Promise<any[]> {
    // Check if user has access to the channel
    const hasAccess = await this.checkChannelAccess(channelId, userId);
    if (!hasAccess) {
      throw new BadRequestError('You do not have access to this channel');
    }

    const files = await prisma.file.findMany({
      where: { channelId },
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
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return files;
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