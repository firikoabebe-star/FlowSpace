import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  createDatabaseBackup,
  createFileBackup,
  createFullBackup,
  restoreDatabase,
  restoreFiles,
  listBackups,
  deleteBackup,
  getBackupStatus,
  scheduleBackup,
} from '../controllers/backup.controller';

const router = Router();

// All backup routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/backup/database:
 *   post:
 *     summary: Create database backup
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Database backup created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     backupPath:
 *                       type: string
 *                 message:
 *                   type: string
 */
router.post('/database', createDatabaseBackup);

/**
 * @swagger
 * /api/backup/files:
 *   post:
 *     summary: Create file backup
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: File backup created successfully
 */
router.post('/files', createFileBackup);

/**
 * @swagger
 * /api/backup/full:
 *   post:
 *     summary: Create full backup (database + files)
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Full backup created successfully
 */
router.post('/full', createFullBackup);

/**
 * @swagger
 * /api/backup/restore/database:
 *   post:
 *     summary: Restore database from backup
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               backupPath:
 *                 type: string
 *                 description: Path to backup file
 *     responses:
 *       200:
 *         description: Database restored successfully
 */
router.post('/restore/database', restoreDatabase);

/**
 * @swagger
 * /api/backup/restore/files:
 *   post:
 *     summary: Restore files from backup
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               backupPath:
 *                 type: string
 *     responses:
 *       200:
 *         description: Files restored successfully
 */
router.post('/restore/files', restoreFiles);

/**
 * @swagger
 * /api/backup:
 *   get:
 *     summary: List all backups
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of backups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     backups:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           filename:
 *                             type: string
 *                           size:
 *                             type: number
 *                           created:
 *                             type: string
 *                           type:
 *                             type: string
 */
router.get('/', listBackups);

/**
 * @swagger
 * /api/backup/status:
 *   get:
 *     summary: Get backup status and statistics
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Backup status information
 */
router.get('/status', getBackupStatus);

/**
 * @swagger
 * /api/backup/schedule:
 *   post:
 *     summary: Schedule automatic backups
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cronExpression:
 *                 type: string
 *                 description: Cron expression for backup schedule
 *     responses:
 *       200:
 *         description: Backup scheduled successfully
 */
router.post('/schedule', scheduleBackup);

/**
 * @swagger
 * /api/backup/{filename}:
 *   delete:
 *     summary: Delete a backup file
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Backup deleted successfully
 */
router.delete('/:filename', deleteBackup);

export default router;