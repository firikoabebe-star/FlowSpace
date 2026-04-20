import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  getSystemStatus,
  getMetrics,
  getAlerts,
  updateAlert,
  addAlert,
  removeAlert,
  getSecurityReport,
  getSecurityEvents,
  getNotificationChannels,
  addNotificationChannel,
  updateNotificationChannel,
  removeNotificationChannel,
  testNotificationChannel,
  sendTestNotification,
} from '../controllers/monitoring.controller';

const router = Router();

// All monitoring routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/monitoring/status:
 *   get:
 *     summary: Get comprehensive system status
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System status retrieved successfully
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
 *                     status:
 *                       type: object
 *                       properties:
 *                         overall:
 *                           type: string
 *                         timestamp:
 *                           type: string
 *                         metrics:
 *                           type: object
 *                         alerts:
 *                           type: object
 */
router.get('/status', getSystemStatus);

/**
 * @swagger
 * /api/monitoring/metrics:
 *   get:
 *     summary: Get system metrics
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Metric key to retrieve
 *       - in: query
 *         name: hours
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Number of hours of data to retrieve
 *     responses:
 *       200:
 *         description: Metrics retrieved successfully
 */
router.get('/metrics', getMetrics);

/**
 * @swagger
 * /api/monitoring/alerts:
 *   get:
 *     summary: Get all monitoring alerts
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alerts retrieved successfully
 *   post:
 *     summary: Create new monitoring alert
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               condition:
 *                 type: string
 *               threshold:
 *                 type: number
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Alert created successfully
 */
router.get('/alerts', getAlerts);
router.post('/alerts', addAlert);

/**
 * @swagger
 * /api/monitoring/alerts/{alertId}:
 *   put:
 *     summary: Update monitoring alert
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Alert updated successfully
 *   delete:
 *     summary: Delete monitoring alert
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alert deleted successfully
 */
router.put('/alerts/:alertId', updateAlert);
router.delete('/alerts/:alertId', removeAlert);

/**
 * @swagger
 * /api/monitoring/security/report:
 *   get:
 *     summary: Get comprehensive security report
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Security report generated successfully
 */
router.get('/security/report', getSecurityReport);

/**
 * @swagger
 * /api/monitoring/security/events:
 *   get:
 *     summary: Get security events
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: hours
 *         schema:
 *           type: integer
 *           default: 24
 *         description: Number of hours of events to retrieve
 *     responses:
 *       200:
 *         description: Security events retrieved successfully
 */
router.get('/security/events', getSecurityEvents);

/**
 * @swagger
 * /api/monitoring/notifications/channels:
 *   get:
 *     summary: Get all notification channels
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification channels retrieved successfully
 *   post:
 *     summary: Create new notification channel
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [email, webhook, slack, sms]
 *               name:
 *                 type: string
 *               config:
 *                 type: object
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Notification channel created successfully
 */
router.get('/notifications/channels', getNotificationChannels);
router.post('/notifications/channels', addNotificationChannel);

/**
 * @swagger
 * /api/monitoring/notifications/channels/{channelId}:
 *   put:
 *     summary: Update notification channel
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification channel updated successfully
 *   delete:
 *     summary: Delete notification channel
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification channel deleted successfully
 */
router.put('/notifications/channels/:channelId', updateNotificationChannel);
router.delete('/notifications/channels/:channelId', removeNotificationChannel);

/**
 * @swagger
 * /api/monitoring/notifications/channels/{channelId}/test:
 *   post:
 *     summary: Test notification channel
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test notification sent
 */
router.post('/notifications/channels/:channelId/test', testNotificationChannel);

/**
 * @swagger
 * /api/monitoring/notifications/test:
 *   post:
 *     summary: Send test notification
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: array
 *                 items:
 *                   type: string
 *               subject:
 *                 type: string
 *               body:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *               channels:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Test notification sent
 */
router.post('/notifications/test', sendTestNotification);

export default router;