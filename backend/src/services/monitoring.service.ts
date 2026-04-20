import { logger } from '../utils/logger';
import { cacheService } from './cache.service';
import { auditService } from './audit.service';
import prisma from '../db/prisma';

interface MetricData {
  timestamp: Date;
  value: number;
  tags?: Record<string, string>;
}

interface Alert {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  lastTriggered?: Date;
}

export class MonitoringService {
  private alerts: Alert[] = [];
  private metrics: Map<string, MetricData[]> = new Map();
  private readonly METRIC_RETENTION_HOURS = 24;
  private readonly MAX_METRICS_PER_KEY = 1440; // 24 hours * 60 minutes

  constructor() {
    this.initializeDefaultAlerts();
    this.startMetricCollection();
  }

  /**
   * Initialize default system alerts
   */
  private initializeDefaultAlerts(): void {
    this.alerts = [
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        condition: 'memory_usage_mb > threshold',
        threshold: 500,
        severity: 'high',
        enabled: true,
      },
      {
        id: 'high_response_time',
        name: 'High Database Response Time',
        condition: 'db_response_time_ms > threshold',
        threshold: 1000,
        severity: 'medium',
        enabled: true,
      },
      {
        id: 'failed_login_attempts',
        name: 'High Failed Login Attempts',
        condition: 'failed_logins_per_minute > threshold',
        threshold: 10,
        severity: 'high',
        enabled: true,
      },
      {
        id: 'low_disk_space',
        name: 'Low Disk Space',
        condition: 'disk_usage_percent > threshold',
        threshold: 85,
        severity: 'critical',
        enabled: true,
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        condition: 'error_rate_percent > threshold',
        threshold: 5,
        severity: 'high',
        enabled: true,
      },
    ];
  }

  /**
   * Start collecting system metrics
   */
  private startMetricCollection(): void {
    // Collect metrics every minute
    setInterval(() => {
      this.collectSystemMetrics();
    }, 60000);

    // Clean up old metrics every hour
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 3600000);
  }

  /**
   * Collect system metrics
   */
  private async collectSystemMetrics(): Promise<void> {
    try {
      // Memory metrics
      const memUsage = process.memoryUsage();
      this.recordMetric('memory_usage_mb', memUsage.heapUsed / 1024 / 1024);
      this.recordMetric('memory_total_mb', memUsage.heapTotal / 1024 / 1024);

      // CPU metrics (approximation using process.cpuUsage)
      const cpuUsage = process.cpuUsage();
      this.recordMetric('cpu_user_time', cpuUsage.user);
      this.recordMetric('cpu_system_time', cpuUsage.system);

      // Database metrics
      await this.collectDatabaseMetrics();

      // Application metrics
      await this.collectApplicationMetrics();

      // Check alerts
      await this.checkAlerts();
    } catch (error) {
      logger.error('Failed to collect system metrics', error);
    }
  }

  /**
   * Collect database-specific metrics
   */
  private async collectDatabaseMetrics(): Promise<void> {
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;
      
      this.recordMetric('db_response_time_ms', responseTime);

      // Get database connection count (if available)
      try {
        const connections = await prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'
        `;
        this.recordMetric('db_active_connections', Number(connections[0]?.count || 0));
      } catch (error) {
        // Ignore if query fails (might not have permissions)
      }
    } catch (error) {
      logger.error('Failed to collect database metrics', error);
      this.recordMetric('db_response_time_ms', -1); // Indicate failure
    }
  }

  /**
   * Collect application-specific metrics
   */
  private async collectApplicationMetrics(): Promise<void> {
    try {
      // Count recent failed login attempts
      const oneMinuteAgo = new Date(Date.now() - 60000);
      const failedLogins = await prisma.auditLog.count({
        where: {
          action: 'auth.login.failed',
          timestamp: {
            gte: oneMinuteAgo,
          },
        },
      });
      this.recordMetric('failed_logins_per_minute', failedLogins);

      // Count active users (users with activity in last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 300000);
      const activeUsers = await prisma.auditLog.findMany({
        where: {
          timestamp: {
            gte: fiveMinutesAgo,
          },
          userId: {
            not: null,
          },
        },
        distinct: ['userId'],
      });
      this.recordMetric('active_users_5min', activeUsers.length);

      // Count recent errors
      const recentErrors = await prisma.auditLog.count({
        where: {
          action: {
            contains: 'error',
          },
          timestamp: {
            gte: oneMinuteAgo,
          },
        },
      });
      this.recordMetric('errors_per_minute', recentErrors);
    } catch (error) {
      logger.error('Failed to collect application metrics', error);
    }
  }

  /**
   * Record a metric value
   */
  public recordMetric(key: string, value: number, tags?: Record<string, string>): void {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const metrics = this.metrics.get(key)!;
    metrics.push({
      timestamp: new Date(),
      value,
      tags,
    });

    // Keep only recent metrics
    if (metrics.length > this.MAX_METRICS_PER_KEY) {
      metrics.splice(0, metrics.length - this.MAX_METRICS_PER_KEY);
    }

    // Cache recent metric for quick access
    cacheService.set(`metric:${key}:latest`, { value, timestamp: new Date() }, 300);
  }

  /**
   * Get metric values for a time range
   */
  public getMetrics(key: string, hours: number = 1): MetricData[] {
    const metrics = this.metrics.get(key) || [];
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return metrics.filter(m => m.timestamp >= cutoff);
  }

  /**
   * Get latest metric value
   */
  public async getLatestMetric(key: string): Promise<number | null> {
    const cached = await cacheService.get(`metric:${key}:latest`);
    if (cached && typeof cached === 'object' && 'value' in cached) {
      return cached.value as number;
    }

    const metrics = this.metrics.get(key) || [];
    return metrics.length > 0 ? metrics[metrics.length - 1].value : null;
  }

  /**
   * Get metric statistics
   */
  public getMetricStats(key: string, hours: number = 1): {
    min: number;
    max: number;
    avg: number;
    count: number;
  } | null {
    const metrics = this.getMetrics(key, hours);
    
    if (metrics.length === 0) {
      return null;
    }

    const values = metrics.map(m => m.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      count: values.length,
    };
  }

  /**
   * Check all enabled alerts
   */
  private async checkAlerts(): Promise<void> {
    for (const alert of this.alerts) {
      if (!alert.enabled) continue;

      try {
        await this.checkAlert(alert);
      } catch (error) {
        logger.error(`Failed to check alert ${alert.id}`, error);
      }
    }
  }

  /**
   * Check a specific alert condition
   */
  private async checkAlert(alert: Alert): Promise<void> {
    let triggered = false;
    let currentValue: number | null = null;

    switch (alert.id) {
      case 'high_memory_usage':
        currentValue = await this.getLatestMetric('memory_usage_mb');
        triggered = currentValue !== null && currentValue > alert.threshold;
        break;

      case 'high_response_time':
        currentValue = await this.getLatestMetric('db_response_time_ms');
        triggered = currentValue !== null && currentValue > alert.threshold;
        break;

      case 'failed_login_attempts':
        currentValue = await this.getLatestMetric('failed_logins_per_minute');
        triggered = currentValue !== null && currentValue > alert.threshold;
        break;

      case 'high_error_rate':
        const errors = await this.getLatestMetric('errors_per_minute');
        const total = await this.getLatestMetric('active_users_5min') || 1;
        currentValue = errors !== null ? (errors / total) * 100 : null;
        triggered = currentValue !== null && currentValue > alert.threshold;
        break;

      default:
        return;
    }

    if (triggered) {
      await this.triggerAlert(alert, currentValue);
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(alert: Alert, currentValue: number | null): Promise<void> {
    const now = new Date();
    
    // Prevent spam - only trigger if not triggered in last 5 minutes
    if (alert.lastTriggered && (now.getTime() - alert.lastTriggered.getTime()) < 300000) {
      return;
    }

    alert.lastTriggered = now;

    const alertData = {
      alertId: alert.id,
      name: alert.name,
      severity: alert.severity,
      threshold: alert.threshold,
      currentValue,
      timestamp: now,
    };

    // Log the alert
    logger.warn('Alert triggered', alertData);

    // Record in audit log
    await auditService.log({
      action: 'system.alert.triggered',
      metadata: alertData,
    });

    // Cache alert for dashboard
    await cacheService.set(`alert:${alert.id}:latest`, alertData, 3600);

    // In a real system, you would send notifications here
    // (email, Slack, PagerDuty, etc.)
    await this.sendAlertNotification(alertData);
  }

  /**
   * Send alert notification (placeholder for real implementation)
   */
  private async sendAlertNotification(alertData: any): Promise<void> {
    // This would integrate with your notification system
    logger.info('Alert notification would be sent', alertData);
    
    // Example: Send to webhook, email, Slack, etc.
    // await this.sendToSlack(alertData);
    // await this.sendEmail(alertData);
  }

  /**
   * Get current system status
   */
  public async getSystemStatus(): Promise<any> {
    const status = {
      overall: 'healthy',
      timestamp: new Date().toISOString(),
      metrics: {},
      alerts: {
        active: [],
        total: this.alerts.length,
        enabled: this.alerts.filter(a => a.enabled).length,
      },
    };

    // Get latest metrics
    const metricKeys = [
      'memory_usage_mb',
      'db_response_time_ms',
      'failed_logins_per_minute',
      'active_users_5min',
      'errors_per_minute',
    ];

    for (const key of metricKeys) {
      const value = await this.getLatestMetric(key);
      const stats = this.getMetricStats(key, 1);
      (status.metrics as any)[key] = { current: value, stats };
    }

    // Get active alerts
    const activeAlerts = [];
    for (const alert of this.alerts) {
      if (alert.enabled && alert.lastTriggered) {
        const timeSinceTriggered = Date.now() - alert.lastTriggered.getTime();
        if (timeSinceTriggered < 3600000) { // Active if triggered in last hour
          activeAlerts.push({
            id: alert.id,
            name: alert.name,
            severity: alert.severity,
            lastTriggered: alert.lastTriggered,
          });
        }
      }
    }

    status.alerts.active = activeAlerts;

    // Determine overall status
    if (activeAlerts.some(a => a.severity === 'critical')) {
      status.overall = 'critical';
    } else if (activeAlerts.some(a => a.severity === 'high')) {
      status.overall = 'degraded';
    } else if (activeAlerts.length > 0) {
      status.overall = 'warning';
    }

    return status;
  }

  /**
   * Clean up old metrics
   */
  private cleanupOldMetrics(): void {
    const cutoff = new Date(Date.now() - this.METRIC_RETENTION_HOURS * 60 * 60 * 1000);
    
    for (const [key, metrics] of this.metrics.entries()) {
      const filtered = metrics.filter(m => m.timestamp >= cutoff);
      this.metrics.set(key, filtered);
    }
  }

  /**
   * Get alert configuration
   */
  public getAlerts(): Alert[] {
    return [...this.alerts];
  }

  /**
   * Update alert configuration
   */
  public updateAlert(alertId: string, updates: Partial<Alert>): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    Object.assign(alert, updates);
    return true;
  }

  /**
   * Add custom alert
   */
  public addAlert(alert: Omit<Alert, 'id'> & { id?: string }): string {
    const id = alert.id || `custom_${Date.now()}`;
    this.alerts.push({ ...alert, id });
    return id;
  }

  /**
   * Remove alert
   */
  public removeAlert(alertId: string): boolean {
    const index = this.alerts.findIndex(a => a.id === alertId);
    if (index === -1) return false;

    this.alerts.splice(index, 1);
    return true;
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();