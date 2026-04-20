import { Request, Response, NextFunction } from 'express';
import { WorkspaceService } from '../services/workspace.service';
import { BadRequestError } from '../utils/errors';

const workspaceService = new WorkspaceService();

export class WorkspaceController {
  async createWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, slug } = req.body;
      const userId = req.user?.userId;

      if (!name) {
        throw new BadRequestError('Workspace name is required');
      }

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const workspace = await workspaceService.createWorkspace(userId, name, slug);

      res.status(201).json({
        success: true,
        data: { workspace },
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserWorkspaces(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const workspaces = await workspaceService.getUserWorkspaces(userId);

      res.json({
        success: true,
        data: { workspaces },
      });
    } catch (error) {
      next(error);
    }
  }

  async getWorkspaceBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const workspace = await workspaceService.getWorkspaceBySlug(slug, userId);

      res.json({
        success: true,
        data: { workspace },
      });
    } catch (error) {
      next(error);
    }
  }

  async joinWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      const { inviteCode } = req.body;
      const userId = req.user?.userId;

      if (!inviteCode) {
        throw new BadRequestError('Invite code is required');
      }

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const workspace = await workspaceService.joinWorkspace(inviteCode, userId);

      res.json({
        success: true,
        data: { workspace },
        message: 'Successfully joined workspace',
      });
    } catch (error) {
      next(error);
    }
  }

  async updateWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const workspace = await workspaceService.updateWorkspace(id, userId, { name, description });

      res.json({
        success: true,
        data: { workspace },
        message: 'Workspace updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteWorkspace(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      await workspaceService.deleteWorkspace(id, userId);

      res.json({
        success: true,
        message: 'Workspace deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async regenerateInviteCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new BadRequestError('User not authenticated');
      }

      const inviteCode = await workspaceService.regenerateInviteCode(id, userId);

      res.json({
        success: true,
        data: { inviteCode },
        message: 'Invite code regenerated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}