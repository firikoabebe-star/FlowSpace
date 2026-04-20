import { logger } from '../utils/logger';
import { auditService } from './audit.service';
import prisma from '../db/prisma';

interface NotificationChannel {
  id: string;
  type: 'email' | 'webhook' | 'slack' | 'sms';
  name: string;
  config: Record<string, any>;
  enabled: boolean;
}

interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'alert' | 'system' | 'user';
}

interface NotificationPayload {
  to: string[];
  subject: string;
  body: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  channels?: string[];
  metadata?: Record<string, any>;
}

export class NotificationService {
  private channels: NotificationChannel[] = [];
  private templates: NotificationTemplate[] = [];

  constructor() {
    this.initializeDefaultChannels();
    this.initializeDefaultTemplates();
  }

  /**
   * Initialize default notification channels
   */
  private initializeDefaultChannels(): void {
    // Email channel (if SMTP is configured)
    if (process.env.SMTP_HOST) {
      this.channels.push({
        id: 'email_default',
        type: 'email',
        name: 'Default Email',
        config: {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
        },
        enabled: true,
      });
    }

    // Webhook channel (if configured)
    if (process.env.WEBHOOK_URL) {
      this.channels.push({
        id: 'webhook_default',
        type: 'webhook',
        name: 'Default Webhook',
        config: {
          url: process.env.WEBHOOK_URL,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.WEBHOOK_AUTH || '',
          },
        },
        enabled: true,
      });
    }

    // Slack channel (if configured)
    if (process.env.SLACK_WEBHOOK_URL) {
      this.channels.push({
        id: 'slack_default',
        type: 'slack',
        name: 'Default Slack',
        config: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          channel: process.env.SLACK_CHANNEL || '#alerts',
          username: process.env.SLACK_USERNAME || 'FlowSpace Bot',
        },
        enabled: true,
      });
    }
  }

  /**
   * Initialize default notification templates
   */
  private initializeDefaultTemplates(): void {
    this.templates = [
      {
        id: 'alert_critical',
        name: 'Critical Alert',
        subject: '🚨 CRITICAL: {{alertName}} - FlowSpace',
        body: `
CRITICAL ALERT TRIGGERED

Alert: {{alertName}}
Severity: {{severity}}
Current Value: {{currentValue}}
Threshold: {{threshold}}
Time: {{timestamp}}

Description: {{description}}

Please investigate immediately.

---
FlowSpace Monitoring System
        `.trim(),
        type: 'alert',
      },
      {
        id: 'alert_high',
        name: 'High Priority Alert',
        subject: '⚠️ HIGH: {{alertName}} - FlowSpace',
        body: `
HIGH PRIORITY ALERT

Alert: {{alertName}}
Severity: {{severity}}
Current Value: {{currentValue}}
Threshold: {{threshold}}
Time: {{timestamp}}

Description: {{description}}

Please review when possible.

---
FlowSpace Monitoring System
        `.trim(),
        type: 'alert',
      },
      {
        id: 'system_backup_success',
        name: 'Backup Success',
        subject: '✅ Backup Completed Successfully - FlowSpace',
        body: `
Backup completed successfully.

Type: {{backupType}}
Size: {{backupSize}}
Duration: {{duration}}
Location: {{backupPath}}
Time: {{timestamp}}

---
FlowSpace Backup System
        `.trim(),
        type: 'system',
      },
      {
        id: 'system_backup_failed',
        name: 'Backup Failed',
        subject: '❌ Backup Failed - FlowSpace',
        body: `
Backup operation failed.

Type: {{backupType}}
Error: {{error}}
Time: {{timestamp}}

Please check the system logs for more details.

---
FlowSpace Backup System
        `.trim(),
        type: 'system',
      },
      {
        id: 'user_welcome',
        name: 'Welcome New User',
        subject: 'Welcome to FlowSpace! 🎉',
        body: `
Welcome to FlowSpace, {{displayName}}!

Your account has been successfully created:
- Username: {{username}}
- Email: {{email}}
- Joined: {{joinDate}}

Get started by:
1. Joining a workspace or creating your own
2. Setting up your profile
3. Inviting team members

If you need help, check out our documentation or contact support.

Welcome aboard!

---
The FlowSpace Team
        `.trim(),
        type: 'user',
      },
    ];
  }

  /**
   * Send notification using specified channels
   */
  public async sendNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      const channelsToUse = payload.channels 
        ? this.channels.filter(c => payload.channels!.includes(c.id) && c.enabled)
        : this.channels.filter(c => c.enabled);

      if (channelsToUse.length === 0) {
        logger.warn('No enabled notification channels available');
        return false;
      }

      const results = await Promise.allSettled(
        channelsToUse.map(channel => this.sendToChannel(channel, payload))
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const success = successCount > 0;

      // Log notification attempt
      await auditService.log({
        action: 'notification.sent',
        metadata: {
          channels: channelsToUse.map(c => c.id),
          success,
          successCount,
          totalChannels: channelsToUse.length,
          subject: payload.subject,
          priority: payload.priority,
        },
      });

      return success;
    } catch (error) {
      logger.error('Failed to send notification', error);
      return false;
    }
  }

  /**
   * Send notification to a specific channel
   */
  private async sendToChannel(channel: NotificationChannel, payload: NotificationPayload): Promise<void> {
    switch (channel.type) {
      case 'email':
        await this.sendEmail(channel, payload);
        break;
      case 'webhook':
        await this.sendWebhook(channel, payload);
        break;
      case 'slack':
        await this.sendSlack(channel, payload);
        break;
      case 'sms':
        await this.sendSMS(channel, payload);
        break;
      default:
        throw new Error(`Unsupported channel type: ${channel.type}`);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(channel: NotificationChannel, payload: NotificationPayload): Promise<void> {
    // This is a placeholder - in a real implementation, you would use nodemailer or similar
    logger.info('Email notification sent', {
      channel: channel.id,
      to: payload.to,
      subject: payload.subject,
    });

    // Example implementation with nodemailer:
    /*
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransporter({
      host: channel.config.host,
      port: channel.config.port,
      auth: {
        user: channel.config.user,
        pass: channel.config.pass,
      },
    });

    await transporter.sendMail({
      from: channel.config.from,
      to: payload.to.join(', '),
      subject: payload.subject,
      text: payload.body,
    });
    */
  }

  /**
   * Send webhook notification
   */
  private async sendWebhook(channel: NotificationChannel, payload: NotificationPayload): Promise<void> {
    const webhookPayload = {
      subject: payload.subject,
      body: payload.body,
      priority: payload.priority,
      timestamp: new Date().toISOString(),
      metadata: payload.metadata,
    };

    // This is a placeholder - in a real implementation, you would use fetch or axios
    logger.info('Webhook notification sent', {
      channel: channel.id,
      url: channel.config.url,
      payload: webhookPayload,
    });

    // Example implementation:
    /*
    const response = await fetch(channel.config.url, {
      method: 'POST',
      headers: channel.config.headers,
      body: JSON.stringify(webhookPayload),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }
    */
  }

  /**
   * Send Slack notification
   */
  private async sendSlack(channel: NotificationChannel, payload: NotificationPayload): Promise<void> {
    const slackPayload = {
      channel: channel.config.channel,
      username: channel.config.username,
      text: payload.subject,
      attachments: [
        {
          color: this.getSlackColor(payload.priority),
          text: payload.body,
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    logger.info('Slack notification sent', {
      channel: channel.id,
      slackChannel: channel.config.channel,
      payload: slackPayload,
    });

    // Example implementation:
    /*
    const response = await fetch(channel.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status}`);
    }
    */
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(channel: NotificationChannel, payload: NotificationPayload): Promise<void> {
    // This is a placeholder - in a real implementation, you would use Twilio or similar
    logger.info('SMS notification sent', {
      channel: channel.id,
      to: payload.to,
      message: `${payload.subject}\n\n${payload.body}`,
    });
  }

  /**
   * Get Slack color based on priority
   */
  private getSlackColor(priority: string): string {
    switch (priority) {
      case 'urgent': return 'danger';
      case 'high': return 'warning';
      case 'normal': return 'good';
      case 'low': return '#36a64f';
      default: return 'good';
    }
  }

  /**
   * Send notification using template
   */
  public async sendTemplatedNotification(
    templateId: string,
    variables: Record<string, any>,
    to: string[],
    priority: NotificationPayload['priority'] = 'normal',
    channels?: string[]
  ): Promise<boolean> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      logger.error(`Template not found: ${templateId}`);
      return false;
    }

    const subject = this.renderTemplate(template.subject, variables);
    const body = this.renderTemplate(template.body, variables);

    return this.sendNotification({
      to,
      subject,
      body,
      priority,
      channels,
      metadata: { templateId, variables },
    });
  }

  /**
   * Render template with variables
   */
  private renderTemplate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }

  /**
   * Send alert notification
   */
  public async sendAlert(alertData: {
    alertId: string;
    name: string;
    severity: string;
    threshold: number;
    currentValue: number | null;
    timestamp: Date;
    description?: string;
  }): Promise<boolean> {
    const templateId = alertData.severity === 'critical' ? 'alert_critical' : 'alert_high';
    
    const variables = {
      alertName: alertData.name,
      severity: alertData.severity.toUpperCase(),
      currentValue: alertData.currentValue?.toString() || 'N/A',
      threshold: alertData.threshold.toString(),
      timestamp: alertData.timestamp.toISOString(),
      description: alertData.description || 'No additional description provided.',
    };

    // Get admin users (in a real system, you'd have proper admin role management)
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    
    return this.sendTemplatedNotification(
      templateId,
      variables,
      adminEmails,
      alertData.severity === 'critical' ? 'urgent' : 'high'
    );
  }

  /**
   * Send backup notification
   */
  public async sendBackupNotification(
    success: boolean,
    backupData: {
      type: string;
      size?: string;
      duration?: string;
      path?: string;
      error?: string;
    }
  ): Promise<boolean> {
    const templateId = success ? 'system_backup_success' : 'system_backup_failed';
    
    const variables = {
      backupType: backupData.type,
      backupSize: backupData.size || 'N/A',
      duration: backupData.duration || 'N/A',
      backupPath: backupData.path || 'N/A',
      error: backupData.error || 'N/A',
      timestamp: new Date().toISOString(),
    };

    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    
    return this.sendTemplatedNotification(
      templateId,
      variables,
      adminEmails,
      success ? 'normal' : 'high'
    );
  }

  /**
   * Send welcome notification to new user
   */
  public async sendWelcomeNotification(user: {
    email: string;
    username: string;
    displayName: string;
    createdAt: Date;
  }): Promise<boolean> {
    const variables = {
      displayName: user.displayName,
      username: user.username,
      email: user.email,
      joinDate: user.createdAt.toLocaleDateString(),
    };

    return this.sendTemplatedNotification(
      'user_welcome',
      variables,
      [user.email],
      'normal'
    );
  }

  /**
   * Get notification channels
   */
  public getChannels(): NotificationChannel[] {
    return [...this.channels];
  }

  /**
   * Add notification channel
   */
  public addChannel(channel: Omit<NotificationChannel, 'id'> & { id?: string }): string {
    const id = channel.id || `channel_${Date.now()}`;
    this.channels.push({ ...channel, id });
    return id;
  }

  /**
   * Update notification channel
   */
  public updateChannel(channelId: string, updates: Partial<NotificationChannel>): boolean {
    const channel = this.channels.find(c => c.id === channelId);
    if (!channel) return false;

    Object.assign(channel, updates);
    return true;
  }

  /**
   * Remove notification channel
   */
  public removeChannel(channelId: string): boolean {
    const index = this.channels.findIndex(c => c.id === channelId);
    if (index === -1) return false;

    this.channels.splice(index, 1);
    return true;
  }

  /**
   * Get notification templates
   */
  public getTemplates(): NotificationTemplate[] {
    return [...this.templates];
  }

  /**
   * Test notification channel
   */
  public async testChannel(channelId: string): Promise<boolean> {
    const channel = this.channels.find(c => c.id === channelId);
    if (!channel) return false;

    const testPayload: NotificationPayload = {
      to: ['test@example.com'],
      subject: 'FlowSpace Notification Test',
      body: 'This is a test notification from FlowSpace. If you receive this, the notification channel is working correctly.',
      priority: 'normal',
      metadata: { test: true },
    };

    try {
      await this.sendToChannel(channel, testPayload);
      return true;
    } catch (error) {
      logger.error(`Failed to test channel ${channelId}`, error);
      return false;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();