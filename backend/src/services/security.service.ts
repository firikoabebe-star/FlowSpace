import crypto from 'crypto';
import { Request } from 'express';
import { logger } from '../utils/logger';
import { auditService } from './audit.service';
import { cacheService } from './cache.service';
import { notificationService } from './notification.service';
import prisma from '../db/prisma';

interface SecurityEvent {
  type: 'suspicious_login' | 'brute_force' | 'unusual_activity' | 'data_breach' | 'privilege_escalation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  details: Record<string, any>;
  timestamp: Date;
}

interface RateLimitRule {
  id: string;
  name: string;
  pattern: string; // URL pattern or action pattern
  windowMs: number;
  maxRequests: number;
  enabled: boolean;
}

interface SecurityPolicy {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSymbols: boolean;
  maxLoginAttempts: number;
  lockoutDurationMs: number;
  sessionTimeoutMs: number;
  requireMFA: boolean;
  allowedFileTypes: string[];
  maxFileSize: number;
}

export class SecurityService {
  private securityEvents: SecurityEvent[] = [];
  private rateLimitRules: RateLimitRule[] = [];
  private securityPolicy: SecurityPolicy;
  private suspiciousIPs: Set<string> = new Set();
  private blockedIPs: Set<string> = new Set();

  constructor() {
    this.initializeSecurityPolicy();
    this.initializeRateLimitRules();
    this.startSecurityMonitoring();
  }

  /**
   * Initialize default security policy
   */
  private initializeSecurityPolicy(): void {
    this.securityPolicy = {
      passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
      passwordRequireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
      passwordRequireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
      passwordRequireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
      passwordRequireSymbols: process.env.PASSWORD_REQUIRE_SYMBOLS === 'true',
      maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
      lockoutDurationMs: parseInt(process.env.LOCKOUT_DURATION_MS || '900000'), // 15 minutes
      sessionTimeoutMs: parseInt(process.env.SESSION_TIMEOUT_MS || '86400000'), // 24 hours
      requireMFA: process.env.REQUIRE_MFA === 'true',
      allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,gif,pdf,doc,docx,txt').split(','),
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    };
  }

  /**
   * Initialize rate limiting rules
   */
  private initializeRateLimitRules(): void {
    this.rateLimitRules = [
      {
        id: 'login_attempts',
        name: 'Login Attempts',
        pattern: '/api/auth/login',
        windowMs: 900000, // 15 minutes
        maxRequests: 5,
        enabled: true,
      },
      {
        id: 'password_reset',
        name: 'Password Reset',
        pattern: '/api/auth/reset-password',
        windowMs: 3600000, // 1 hour
        maxRequests: 3,
        enabled: true,
      },
      {
        id: 'file_upload',
        name: 'File Upload',
        pattern: '/api/files/upload',
        windowMs: 60000, // 1 minute
        maxRequests: 10,
        enabled: true,
      },
      {
        id: 'message_send',
        name: 'Message Sending',
        pattern: '/api/messages',
        windowMs: 60000, // 1 minute
        maxRequests: 60,
        enabled: true,
      },
    ];
  }

  /**
   * Start security monitoring
   */
  private startSecurityMonitoring(): void {
    // Clean up old security events every hour
    setInterval(() => {
      this.cleanupOldEvents();
    }, 3600000);

    // Review suspicious activities every 5 minutes
    setInterval(() => {
      this.reviewSuspiciousActivities();
    }, 300000);
  }

  /**
   * Validate password against security policy
   */
  public validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < this.securityPolicy.passwordMinLength) {
      errors.push(`Password must be at least ${this.securityPolicy.passwordMinLength} characters long`);
    }

    if (this.securityPolicy.passwordRequireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (this.securityPolicy.passwordRequireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (this.securityPolicy.passwordRequireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (this.securityPolicy.passwordRequireSymbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if IP is blocked
   */
  public isIPBlocked(ipAddress: string): boolean {
    return this.blockedIPs.has(ipAddress);
  }

  /**
   * Block IP address
   */
  public async blockIP(ipAddress: string, reason: string, durationMs?: number): Promise<void> {
    this.blockedIPs.add(ipAddress);
    
    // Cache the block with expiration
    if (durationMs) {
      await cacheService.set(`blocked_ip:${ipAddress}`, { reason, blockedAt: new Date() }, durationMs / 1000);
    }

    await this.recordSecurityEvent({
      type: 'brute_force',
      severity: 'high',
      ipAddress,
      details: { reason, action: 'ip_blocked', duration: durationMs },
      timestamp: new Date(),
    });

    logger.warn('IP address blocked', { ipAddress, reason, durationMs });
  }

  /**
   * Unblock IP address
   */
  public async unblockIP(ipAddress: string): Promise<void> {
    this.blockedIPs.delete(ipAddress);
    await cacheService.del(`blocked_ip:${ipAddress}`);
    
    logger.info('IP address unblocked', { ipAddress });
  }

  /**
   * Check login attempts for user/IP
   */
  public async checkLoginAttempts(identifier: string, ipAddress: string): Promise<{
    allowed: boolean;
    attemptsRemaining: number;
    lockoutExpires?: Date;
  }> {
    const userKey = `login_attempts:user:${identifier}`;
    const ipKey = `login_attempts:ip:${ipAddress}`;

    const [userAttempts, ipAttempts] = await Promise.all([
      cacheService.get(userKey) as Promise<{ count: number; firstAttempt: string } | null>,
      cacheService.get(ipKey) as Promise<{ count: number; firstAttempt: string } | null>,
    ]);

    const maxAttempts = this.securityPolicy.maxLoginAttempts;
    const userCount = userAttempts?.count || 0;
    const ipCount = ipAttempts?.count || 0;

    // Check if user is locked out
    if (userCount >= maxAttempts) {
      const lockoutExpires = new Date(
        new Date(userAttempts!.firstAttempt).getTime() + this.securityPolicy.lockoutDurationMs
      );
      
      if (new Date() < lockoutExpires) {
        return {
          allowed: false,
          attemptsRemaining: 0,
          lockoutExpires,
        };
      } else {
        // Lockout expired, reset attempts
        await cacheService.del(userKey);
      }
    }

    // Check if IP is making too many attempts
    if (ipCount >= maxAttempts * 3) { // IP limit is 3x user limit
      await this.blockIP(ipAddress, 'Too many login attempts', this.securityPolicy.lockoutDurationMs);
      return {
        allowed: false,
        attemptsRemaining: 0,
      };
    }

    return {
      allowed: true,
      attemptsRemaining: Math.max(0, maxAttempts - userCount),
    };
  }

  /**
   * Record failed login attempt
   */
  public async recordFailedLogin(identifier: string, ipAddress: string, userAgent?: string): Promise<void> {
    const userKey = `login_attempts:user:${identifier}`;
    const ipKey = `login_attempts:ip:${ipAddress}`;
    const now = new Date().toISOString();

    // Update user attempts
    const userAttempts = await cacheService.get(userKey) as { count: number; firstAttempt: string } | null;
    const newUserCount = (userAttempts?.count || 0) + 1;
    await cacheService.set(userKey, {
      count: newUserCount,
      firstAttempt: userAttempts?.firstAttempt || now,
    }, this.securityPolicy.lockoutDurationMs / 1000);

    // Update IP attempts
    const ipAttempts = await cacheService.get(ipKey) as { count: number; firstAttempt: string } | null;
    const newIpCount = (ipAttempts?.count || 0) + 1;
    await cacheService.set(ipKey, {
      count: newIpCount,
      firstAttempt: ipAttempts?.firstAttempt || now,
    }, this.securityPolicy.lockoutDurationMs / 1000);

    // Record security event
    await this.recordSecurityEvent({
      type: 'suspicious_login',
      severity: newUserCount >= 3 ? 'high' : 'medium',
      ipAddress,
      userAgent,
      details: {
        identifier,
        attemptCount: newUserCount,
        ipAttemptCount: newIpCount,
      },
      timestamp: new Date(),
    });

    // Mark IP as suspicious if too many attempts
    if (newIpCount >= this.securityPolicy.maxLoginAttempts) {
      this.suspiciousIPs.add(ipAddress);
    }
  }

  /**
   * Clear login attempts on successful login
   */
  public async clearLoginAttempts(identifier: string, ipAddress: string): Promise<void> {
    await Promise.all([
      cacheService.del(`login_attempts:user:${identifier}`),
      cacheService.del(`login_attempts:ip:${ipAddress}`),
    ]);
  }

  /**
   * Validate file upload
   */
  public validateFileUpload(file: {
    originalname: string;
    mimetype: string;
    size: number;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check file size
    if (file.size > this.securityPolicy.maxFileSize) {
      errors.push(`File size exceeds maximum allowed size of ${this.securityPolicy.maxFileSize} bytes`);
    }

    // Check file type
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    if (!extension || !this.securityPolicy.allowedFileTypes.includes(extension)) {
      errors.push(`File type '${extension}' is not allowed`);
    }

    // Check MIME type consistency
    const expectedMimeTypes: Record<string, string[]> = {
      'jpg': ['image/jpeg'],
      'jpeg': ['image/jpeg'],
      'png': ['image/png'],
      'gif': ['image/gif'],
      'pdf': ['application/pdf'],
      'doc': ['application/msword'],
      'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      'txt': ['text/plain'],
    };

    if (extension && expectedMimeTypes[extension]) {
      if (!expectedMimeTypes[extension].includes(file.mimetype)) {
        errors.push(`MIME type '${file.mimetype}' does not match file extension '${extension}'`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Scan file for malware (placeholder)
   */
  public async scanFile(filePath: string): Promise<{ safe: boolean; threats: string[] }> {
    // This is a placeholder for malware scanning
    // In a real implementation, you would integrate with ClamAV, VirusTotal, or similar
    
    logger.info('File scanned for malware', { filePath });
    
    return {
      safe: true,
      threats: [],
    };
  }

  /**
   * Detect unusual user activity
   */
  public async detectUnusualActivity(userId: string, req: Request): Promise<boolean> {
    const userKey = `user_activity:${userId}`;
    const activity = await cacheService.get(userKey) as {
      ipAddresses: string[];
      userAgents: string[];
      locations: string[];
      lastSeen: string;
    } | null;

    const currentIP = req.ip || 'unknown';
    const currentUserAgent = req.get('User-Agent') || 'unknown';
    const now = new Date();

    if (!activity) {
      // First time seeing this user, record baseline
      await cacheService.set(userKey, {
        ipAddresses: [currentIP],
        userAgents: [currentUserAgent],
        locations: [], // Would be populated with geolocation data
        lastSeen: now.toISOString(),
      }, 86400 * 7); // Keep for 7 days
      return false;
    }

    let unusual = false;
    const details: Record<string, any> = {};

    // Check for new IP address
    if (!activity.ipAddresses.includes(currentIP)) {
      unusual = true;
      details.newIP = currentIP;
      details.previousIPs = activity.ipAddresses;
    }

    // Check for new user agent
    if (!activity.userAgents.includes(currentUserAgent)) {
      unusual = true;
      details.newUserAgent = currentUserAgent;
    }

    // Check for rapid location changes (would require geolocation)
    // This is a placeholder for geolocation-based detection

    if (unusual) {
      await this.recordSecurityEvent({
        type: 'unusual_activity',
        severity: 'medium',
        userId,
        ipAddress: currentIP,
        userAgent: currentUserAgent,
        details,
        timestamp: now,
      });

      // Update activity record
      const updatedActivity = {
        ipAddresses: [...new Set([...activity.ipAddresses, currentIP])].slice(-10), // Keep last 10 IPs
        userAgents: [...new Set([...activity.userAgents, currentUserAgent])].slice(-5), // Keep last 5 user agents
        locations: activity.locations,
        lastSeen: now.toISOString(),
      };
      await cacheService.set(userKey, updatedActivity, 86400 * 7);
    }

    return unusual;
  }

  /**
   * Record security event
   */
  public async recordSecurityEvent(event: SecurityEvent): Promise<void> {
    this.securityEvents.push(event);

    // Log to audit system
    await auditService.log({
      action: `security.${event.type}`,
      userId: event.userId,
      metadata: {
        severity: event.severity,
        details: event.details,
      },
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
    });

    // Send notification for high/critical events
    if (event.severity === 'high' || event.severity === 'critical') {
      await notificationService.sendAlert({
        alertId: `security_${event.type}`,
        name: `Security Event: ${event.type.replace('_', ' ')}`,
        severity: event.severity,
        threshold: 0,
        currentValue: 1,
        timestamp: event.timestamp,
        description: JSON.stringify(event.details),
      });
    }

    logger.warn('Security event recorded', event);
  }

  /**
   * Get security events
   */
  public getSecurityEvents(hours: number = 24): SecurityEvent[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.securityEvents.filter(event => event.timestamp >= cutoff);
  }

  /**
   * Generate security report
   */
  public async generateSecurityReport(): Promise<any> {
    const events = this.getSecurityEvents(24);
    const eventsByType = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const eventsBySeverity = events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get failed login attempts from last 24 hours
    const failedLogins = await prisma.auditLog.count({
      where: {
        action: 'auth.login.failed',
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    return {
      timestamp: new Date().toISOString(),
      period: '24 hours',
      summary: {
        totalEvents: events.length,
        failedLogins,
        blockedIPs: this.blockedIPs.size,
        suspiciousIPs: this.suspiciousIPs.size,
      },
      eventsByType,
      eventsBySeverity,
      topSuspiciousIPs: Array.from(this.suspiciousIPs).slice(0, 10),
      recentEvents: events.slice(-10),
      securityPolicy: this.securityPolicy,
    };
  }

  /**
   * Clean up old security events
   */
  private cleanupOldEvents(): void {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Keep 7 days
    this.securityEvents = this.securityEvents.filter(event => event.timestamp >= cutoff);
  }

  /**
   * Review suspicious activities
   */
  private async reviewSuspiciousActivities(): Promise<void> {
    // Auto-block IPs with too many suspicious activities
    for (const ip of this.suspiciousIPs) {
      const recentEvents = this.securityEvents.filter(
        event => event.ipAddress === ip && 
        event.timestamp >= new Date(Date.now() - 60 * 60 * 1000) // Last hour
      );

      if (recentEvents.length >= 10) {
        await this.blockIP(ip, 'Automated block due to suspicious activity', 24 * 60 * 60 * 1000); // 24 hours
        this.suspiciousIPs.delete(ip);
      }
    }
  }

  /**
   * Hash sensitive data
   */
  public hashSensitiveData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate secure token
   */
  public generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Encrypt sensitive data
   */
  public encryptData(data: string, key?: string): string {
    const encryptionKey = key || process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  public decryptData(encryptedData: string, key?: string): string {
    const encryptionKey = key || process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Get security policy
   */
  public getSecurityPolicy(): SecurityPolicy {
    return { ...this.securityPolicy };
  }

  /**
   * Update security policy
   */
  public updateSecurityPolicy(updates: Partial<SecurityPolicy>): void {
    this.securityPolicy = { ...this.securityPolicy, ...updates };
    logger.info('Security policy updated', updates);
  }
}

// Export singleton instance
export const securityService = new SecurityService();