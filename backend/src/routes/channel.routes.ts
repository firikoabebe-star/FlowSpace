import { Router } from 'express';
import { ChannelController } from '../controllers/channel.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const channelController = new ChannelController();

// All channel routes require authentication
router.use(authenticate);

router.post('/workspace/:workspaceId', channelController.createChannel.bind(channelController));
router.get('/:id', channelController.getChannelById.bind(channelController));
router.put('/:id', channelController.updateChannel.bind(channelController));
router.delete('/:id', channelController.deleteChannel.bind(channelController));
router.post('/:id/join', channelController.joinChannel.bind(channelController));
router.post('/:id/leave', channelController.leaveChannel.bind(channelController));
router.post('/:id/members', channelController.addMemberToChannel.bind(channelController));

export default router;