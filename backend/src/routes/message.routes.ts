import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const messageController = new MessageController();

// All message routes require authentication
router.use(authenticate);

// Channel messages
router.get('/channel/:channelId', messageController.getChannelMessages.bind(messageController));
router.get('/channel/:channelId/search', messageController.searchChannelMessages.bind(messageController));
router.post('/channel/:channelId', messageController.createMessage.bind(messageController));
router.put('/:messageId', messageController.updateMessage.bind(messageController));
router.delete('/:messageId', messageController.deleteMessage.bind(messageController));

// Direct messages
router.get('/direct/conversations', messageController.getDirectMessageConversations.bind(messageController));
router.get('/direct/:otherUserId', messageController.getDirectMessages.bind(messageController));
router.post('/direct/:receiverId', messageController.createDirectMessage.bind(messageController));
router.put('/direct/:otherUserId/read', messageController.markDirectMessagesAsRead.bind(messageController));

export default router;