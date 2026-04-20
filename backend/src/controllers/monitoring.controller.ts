import { Request, Response } from 'express';
import { monitoringService } from '../services/monitoring.service';
import { securityService } from '../services/security.service';
import { notificationService } from '../services/notification.service';
import { auditService } from '../services/audit.service';
import { logger } from '../utils/logger';

export const getSystemStatus = async (req: Request, res: Response) => {
  try {
    const status = await monitoringService.getSystemStatus();
    
    res.json({
      success: true,
      data: { status },
    });
  } catch (error) {
    logger.error('Failed to get system status', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system status',
    });
  }
};

export const getMetrics = async (req: Request, res: Response) => {
  try {
    const { key, hours = '1' } = req.query;
    
    if (!key || typeof key !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Metric key is required',
      });
    }

    const hoursNum = parseInt(hours as string);
    const metrics = monitoringService.getMetrics(key, hoursNum);
    const stats = monitoringService.getMetricStats(key, hoursNum);
    
    res.json({
      success: true,
      data: {
        key,
        hours: hoursNum,
        metrics,
        stats,
      },
    });
  } catch (error) {
    logger.error('Failed to get metrics', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get metrics',
    });
  }
};

export const getAlerts = async (req: Request, res: Response) => {
  try {
    const alerts = monitoringService.getAlerts();
    
    res.json({
      success: true,
      data: { alerts },
    });
  } catch (error) {
    logger.error('Failed to get alerts', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get alerts',
    });
  }
};

export const updateAlert = async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const updates = req.body;
    
    const success = monitoringService.updateAlert(alertId, updates);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    await auditService.log({
      action: 'monitoring.alert.updated',
      userId: req.user?.id,
      metadata: { alertId, updates },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    res.json({
      success: true,
      message: 'Alert updated successfully',
    });
  } catch (error) {
    logger.error('Failed to update alert', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update alert',
    });
  }
};

export const addAlert = async (req: Request, res: Response) => {
  try {
    const alertData = req.body;
    
    const alertId = monitoringService.addAlert(alertData);
    
    await auditService.log({
      action: 'monitoring.alert.created',
      userId: req.user?.id,
      metadata: { alertId, alertData },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    res.json({
      success: true,
      data: { alertId },
      message: 'Alert created successfully',
    });
  } catch (error) {
    logger.error('Failed to create alert', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create alert',
    });
  }
};

export const removeAlert = async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    
    const success = monitoringService.removeAlert(alertId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    await auditService.log({
      action: 'monitoring.alert.deleted',
      userId: req.user?.id,
      metadata: { alertId },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    res.json({
      success: true,
      message: 'Alert deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete alert', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete alert',
    });
  }
};

export const getSecurityReport = async (req: Request, res: Response) => {
  try {
    const report = await securityService.generateSecurityReport();
    
    res.json({
      success: true,
      data: { report },
    });
  } catch (error) {
    logger.error('Failed to generate security report', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate security report',
    });
  }
};

export const getSecurityEvents = async (req: Request, res: Response) => {
  try {
    const { hours = '24' } = req.query;
    const hoursNum = parseInt(hours as string);
    
    const events = securityService.getSecurityEvents(hoursNum);
    
    res.json({
      success: true,
      data: {
        events,
        hours: hoursNum,
        total: events.length,
      },
    });
  } catch (error) {
    logger.error('Failed to get security events', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get security events',
    });
  }
};

export const getNotificationChannels = async (req: Request, res: Response) => {
  try {
    const channels = notificationService.getChannels();
    
    res.json({
      success: true,
      data: { channels },
    });
  } catch (error) {
    logger.error('Failed to get notification channels', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification channels',
    });
  }
};

export const addNotificationChannel = async (req: Request, res: Response) => {
  try {
    const channelData = req.body;
    
    const channelId = notificationService.addChannel(channelData);
    
    await auditService.log({
      action: 'notification.channel.created',
      userId: req.user?.id,
      metadata: { channelId, type: channelData.type, name: channelData.name },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    res.json({
      success: true,
      data: { channelId },
      message: 'Notification channel created successfully',
    });
  } catch (error) {
    logger.error('Failed to create notification channel', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification channel',
    });
  }
};

export const updateNotificationChannel = async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;
    const updates = req.body;
    
    const success = notificationService.updateChannel(channelId, updates);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Notification channel not found',
      });
    }

    await auditService.log({
      action: 'notification.channel.updated',
      userId: req.user?.id,
      metadata: { channelId, updates },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    res.json({
      success: true,
      message: 'Notification channel updated successfully',
    });
  } catch (error) {
    logger.error('Failed to update notification channel', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification channel',
    });
  }
};

export const removeNotificationChannel = async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;
    
    const success = notificationService.removeChannel(channelId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Notification channel not found',
      });
    }

    await auditService.log({
      action: 'notification.channel.deleted',
      userId: req.user?.id,
      metadata: { channelId },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    res.json({
      success: true,
      message: 'Notification channel deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete notification channel', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification channel',
    });
  }
};

export const testNotificationChannel = async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;
    
    const success = await notificationService.testChannel(channelId);
    
    await auditService.log({
      action: 'notification.channel.tested',
      userId: req.user?.id,
      metadata: { channelId, success },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    res.json({
      success,
      message: success ? 'Test notification sent successfully' : 'Test notification failed',
    });
  } catch (error) {
    logger.error('Failed to test notification channel', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test notification channel',
    });
  }
};

export const sendTestNotification = async (req: Request, res: Response) => {
  try {
    const { to, subject, body, priority = 'normal', channels } = req.body;
    
    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, subject, body',
      });
    }

    const success = await notificationService.sendNotification({
      to: Array.isArray(to) ? to : [to],
      subject,
      body,
      priority,
      channels,
      metadata: { test: true, sentBy: req.user?.id },
    });
    
    await auditService.log({
      action: 'notification.test.sent',
      userId: req.user?.id,
      metadata: { to, subject, success, channels },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    res.json({
      success,
      message: success ? 'Test notification sent successfully' : 'Test notification failed',
    });
  } catch (error) {
    logger.error('Failed to send test notification', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
    });
  }
};