import { Router } from 'express';
import { FileController } from '../controllers/file.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadSingle } from '../middleware/upload.middleware';

const router = Router();
const fileController = new FileController();

// All file routes require authentication
router.use(authenticate);

router.post('/upload', uploadSingle, fileController.uploadFile.bind(fileController));
router.get('/:fileId', fileController.getFile.bind(fileController));
router.get('/:fileId/download', fileController.downloadFile.bind(fileController));
router.delete('/:fileId', fileController.deleteFile.bind(fileController));
router.get('/channel/:channelId', fileController.getChannelFiles.bind(fileController));

export default router;