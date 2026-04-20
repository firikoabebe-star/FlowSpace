import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const analyticsController = new AnalyticsController();

// All analytics routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /analytics/workspace/{workspaceId}:
 *   get:
 *     summary: Get workspace analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Workspace analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         stats:
 *                           type: object
 */
router.get('/workspace/:workspaceId', analyticsController.getWorkspaceStats.bind(analyticsController));

/**
 * @swagger
 * /analytics/workspace/{workspaceId}/trends:
 *   get:
 *     summary: Get workspace message trends
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *     responses:
 *       200:
 *         description: Message trends retrieved successfully
 */
router.get('/workspace/:workspaceId/trends', analyticsController.getMessageTrends.bind(analyticsController));

/**
 * @swagger
 * /analytics/channel/{channelId}:
 *   get:
 *     summary: Get channel analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Channel analytics retrieved successfully
 */
router.get('/channel/:channelId', analyticsController.getChannelStats.bind(analyticsController));

/**
 * @swagger
 * /analytics/user/engagement:
 *   get:
 *     summary: Get user engagement metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User engagement metrics retrieved successfully
 */
router.get('/user/engagement', analyticsController.getUserEngagement.bind(analyticsController));

/**
 * @swagger
 * /analytics/system:
 *   get:
 *     summary: Get system-wide analytics (admin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System analytics retrieved successfully
 */
router.get('/system', analyticsController.getSystemStats.bind(analyticsController));

/**
 * @swagger
 * /analytics/audit-logs:
 *   get:
 *     summary: Get audit logs (admin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 */
router.get('/audit-logs', analyticsController.getAuditLogs.bind(analyticsController));

export default router;