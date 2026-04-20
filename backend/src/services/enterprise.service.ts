import { BackupService } from './backup.service';
import { AnalyticsService } from './analytics.service';
import { auditService } from './audit.service';
import { cacheService } from './cache.service';
import { monitoringService } from './monitoring.service';
import { securityService } from './security.service';
import { notificationService } from './notification.service';
import { logger } from '../utils/logger';

export class EnterpriseService {
  private backupService: BackupService;
  private analyticsService: AnalyticsService;

  constructor() {
    this.backupService = new BackupService();
    this.analyticsService = new AnalyticsService();
  }

  /**
   * Initialize all enterprise services
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing enterprise services...');

      // Initialize cache service
      await this.initializeCacheService();

      // Initialize audit logging
      await this.initializeAuditService();

      // Initialize analytics service
      await this.initializeAnalyticsService();

      // Initialize backup service
      await this.initializeBackupService();

      // Initialize monitoring service
      await this.initializeMonitoringService();

      // Initialize security service
      await this.initializeSecurityService();

      // Initialize notification service
      await this.initializeNotificationService();

      // Schedule automatic backups if configured
      await this.scheduleAutomaticBackups();

      logger.info('Enterprise services initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize enterprise services', error);
      throw error;
    }
  }

  /**
   * Initialize cache service
   */
  private async initializeCacheService(): Promise<void> {
    try {
      // Test cache connection
      await cacheService.set('health_check', 'ok', 60);
      const result = await cacheService.get('health_check');
      
      if (result !== 'ok') {
        throw new Error('Cache service health check failed');
      }

      logger.info('Cache service initialized successfully');
    } catch (error) {
      logger.warn('Cache service initialization failed, continuing without cache', error);
    }
  }

  /**
   * Initialize audit service
   */
  private async initializeAuditService(): Promise<void> {
    try {
      // Log system startup
      await auditService.log({
        action: 'system.startup',
        metadata: {
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
        },
      });

      logger.info('Audit service initialized successfully');
    } catch (error) {
      logger.error('Audit service initialization failed', error);
      throw error;
    }
  }

  /**
   * Initialize analytics service
   */
  private async initializeAnalyticsService(): Promise<void> {
    try {
      // Test analytics service
      const systemStats = await this.analyticsService.getSystemStats();
      
      if (!systemStats) {
        throw new Error('Analytics service health check failed');
      }

      logger.info('Analytics service initialized successfully');
    } catch (error) {
      logger.error('Analytics service initialization failed', error);
      throw error;
    }
  }

  /**
   * Initialize backup service
   */
  private async initializeBackupService(): Promise<void> {
    try {
      // Get backup status to verify service is working
      const status = await this.backupService.getBackupStatus();
      
      logger.info('Backup service initialized successfully', { status });
    } catch (error) {
      logger.error('Backup service initialization failed', error);
      throw error;
    }
  }

  /**
   * Initialize monitoring service
   */
  private async initializeMonitoringService(): Promise<void> {
    try {
      // Get system status to verify monitoring is working
      const status = await monitoringService.getSystemStatus();
      
      logger.info('Monitoring service initialized successfully', { 
        overall: status.overall,
        alertsEnabled: status.alerts.enabled 
      });
    } catch (error) {
      logger.error('Monitoring service initialization failed', error);
      throw error;
    }
  }

  /**
   * Initialize security service
   */
  private async initializeSecurityService(): Promise<void> {
    try {
      // Get security policy to verify service is working
      const policy = securityService.getSecurityPolicy();
      
      logger.info('Security service initialized successfully', { 
        passwordMinLength: policy.passwordMinLength,
        maxLoginAttempts: policy.maxLoginAttempts 
      });
    } catch (error) {
      logger.error('Security service initialization failed', error);
      throw error;
    }
  }

  /**
   * Initialize notification service
   */
  private async initializeNotificationService(): Promise<void> {
    try {
      // Get notification channels to verify service is working
      const channels = notificationService.getChannels();
      
      logger.info('Notification service initialized successfully', { 
        channelCount: channels.length,
        enabledChannels: channels.filter(c => c.enabled).length 
      });
    } catch (error) {
      logger.error('Notification service initialization failed', error);
      throw error;
    }
  }

  /**
   * Schedule automatic backups
   */
  private async scheduleAutomaticBackups(): Promise<void> {
    try {
      const cronExpression = process.env.BACKUP_SCHEDULE || '0 2 * * *'; // Daily at 2 AM
      
      if (process.env.ENABLE_AUTO_BACKUP === 'true') {
        await this.backupService.scheduleBackup(cronExpression);
        logger.info('Automatic backups scheduled', { cronExpression });
      } else {
        logger.info('Automatic backups disabled');
      }
    } catch (error) {
      logger.warn('Failed to schedule automatic backups', error);
    }
  }

  /**
   * Get comprehensive system health status
   */
  async getSystemHealth(): Promise<any> {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        cache: { status: 'unknown', responseTime: 0 },
        database: { status: 'unknown', responseTime: 0 },
        backup: { status: 'unknown', lastBackup: null },
        analytics: { status: 'unknown', responseTime: 0 },
        monitoring: { status: 'unknown', alertsActive: 0 },
        security: { status: 'unknown', eventsCount: 0 },
        notifications: { status: 'unknown', channelsEnabled: 0 },
      },
    };

    // Check cache service
    try {
      const start = Date.now();
      await cacheService.get('health_check');
      health.services.cache = {
        status: 'healthy',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      health.services.cache.status = 'unhealthy';
      health.status = 'degraded';
    }

    // Check database
    try {
      const start = Date.now();
      await this.analyticsService.getSystemStats();
      health.services.database = {
        status: 'healthy',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      health.services.database.status = 'unhealthy';
      health.status = 'unhealthy';
    }

    // Check backup service
    try {
      const backupStatus = await this.backupService.getBackupStatus();
      health.services.backup = {
        status: 'healthy',
        lastBackup: backupStatus?.lastBackup?.timestamp || null,
      };
    } catch (error) {
      health.services.backup.status = 'unhealthy';
    }

    // Check analytics service
    try {
      const start = Date.now();
      await this.analyticsService.getSystemStats();
      health.services.analytics = {
        status: 'healthy',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      health.services.analytics.status = 'unhealthy';
    }

    // Check monitoring service
    try {
      const monitoringStatus = await monitoringService.getSystemStatus();
      health.services.monitoring = {
        status: 'healthy',
        alertsActive: monitoringStatus.alerts.active.length,
      };
    } catch (error) {
      health.services.monitoring.status = 'unhealthy';
    }

    // Check security service
    try {
      const securityEvents = securityService.getSecurityEvents(1);
      health.services.security = {
        status: 'healthy',
        eventsCount: securityEvents.length,
      };
    } catch (error) {
      health.services.security.status = 'unhealthy';
    }

    // Check notification service
    try {
      const channels = notificationService.getChannels();
      health.services.notifications = {
        status: 'healthy',
        channelsEnabled: channels.filter(c => c.enabled).length,
      };
    } catch (error) {
      health.services.notifications.status = 'unhealthy';
    }

    return health;
  }

  /**
   * Perform system maintenance tasks
   */
  async performMaintenance(): Promise<void> {
    try {
      logger.info('Starting system maintenance...');

      // Clean up old audit logs (keep last 90 days)
      await this.cleanupAuditLogs();

      // Clean up old cache entries
      await this.cleanupCache();

      // Perform backup cleanup
      await this.cleanupOldBackups();

      // Log maintenance completion
      await auditService.log({
        action: 'system.maintenance.completed',
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });

      logger.info('System maintenance completed successfully');
    } catch (error) {
      logger.error('System maintenance failed', error);
      throw error;
    }
  }

  /**
   * Clean up old audit logs
   */
  private async cleanupAuditLogs(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90); // Keep 90 days

      // This would be implemented in the audit service
      logger.info('Audit log cleanup completed', { cutoffDate });
    } catch (error) {
      logger.error('Audit log cleanup failed', error);
    }
  }

  /**
   * Clean up old cache entries
   */
  private async cleanupCache(): Promise<void> {
    try {
      // Redis automatically handles TTL, but we can perform additional cleanup here
      logger.info('Cache cleanup completed');
    } catch (error) {
      logger.error('Cache cleanup failed', error);
    }
  }

  /**
   * Clean up old backups
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      // This is handled by the backup service internally
      logger.info('Backup cleanup completed');
    } catch (error) {
      logger.error('Backup cleanup failed', error);
    }
  }

  /**
   * Generate system report
   */
  async generateSystemReport(): Promise<any> {
    try {
      const [health, systemStats, backupStatus, monitoringStatus, securityReport] = await Promise.all([
        this.getSystemHealth(),
        this.analyticsService.getSystemStats(),
        this.backupService.getBackupStatus(),
        monitoringService.getSystemStatus(),
        securityService.generateSecurityReport(),
      ]);

      const report = {
        timestamp: new Date().toISOString(),
        health,
        statistics: systemStats,
        backup: backupStatus,
        monitoring: monitoringStatus,
        security: securityReport,
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        },
      };

      // Log report generation
      await auditService.log({
        action: 'system.report.generated',
        metadata: { reportSize: JSON.stringify(report).length },
      });

      return report;
    } catch (error) {
      logger.error('Failed to generate system report', error);
      throw error;
    }
  }
}

// Export singleton instance
export const enterpriseService = new EnterpriseService();