import { Router } from 'express';
import { WorkspaceController } from '../controllers/workspace.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const workspaceController = new WorkspaceController();

// All workspace routes require authentication
router.use(authenticate);

router.post('/', workspaceController.createWorkspace.bind(workspaceController));
router.get('/', workspaceController.getUserWorkspaces.bind(workspaceController));
router.get('/:slug', workspaceController.getWorkspaceBySlug.bind(workspaceController));
router.put('/:id', workspaceController.updateWorkspace.bind(workspaceController));
router.delete('/:id', workspaceController.deleteWorkspace.bind(workspaceController));
router.post('/join', workspaceController.joinWorkspace.bind(workspaceController));
router.post('/:id/regenerate-invite', workspaceController.regenerateInviteCode.bind(workspaceController));

export default router;