import { Router } from 'express';
import { ReactionController } from '../controllers/reaction.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const reactionController = new ReactionController();

// All reaction routes require authentication
router.use(authenticate);

router.post('/messages/:messageId/reactions', reactionController.addReaction.bind(reactionController));
router.delete('/messages/:messageId/reactions/:emoji', reactionController.removeReaction.bind(reactionController));
router.get('/messages/:messageId/reactions', reactionController.getMessageReactions.bind(reactionController));

export default router;