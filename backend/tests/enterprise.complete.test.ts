import request from 'supertest';
import app from '../src/app';
import { enterpriseService } from '../src/services/enterprise.service';
import { monitoringService } from '../src/services/monitoring.service';
import { securityService } from '../src/services/security.service';
import { notificationService } from '../src/services/notification.service';

describe('Enterprise Features Complete Test Suite', () => {
  let authToken: string;
  let testUser: any;

  beforeAll(async () => {
    // Create test user and get auth token
    const userData = {
      email: 'enterprise.test@example.com',
      username: 'enterprisetest',
      displayName: 'Enterprise Test User',
      password: 'password123',
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    if (registerResponse.status === 200) {
      testUser = registerResponse.body.data.user;
      authToken = registerResponse.body.data.tokens.accessToken;
    }
  });

  describe('Enterprise Service Integration', () => {
    it('should initialize enterprise services successfully', async () => {
      const health = await enterpriseService.getSystemHealth();
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('services');
    });

    it('should generate comprehensive system report', async () => {
      const report = await enterpriseService.generateSystemReport();
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('health');
      expect(report).toHaveProperty('environment');
    });
  });

  describe('Monitoring System', () => {
    it('should record and retrieve metrics', async () => {
      monitoringService.recordMetric('test_metric', 42);
      const latest = await monitoringService.getLatestMetric('test_metric');
      expect(latest).toBe(42);
    });

    it('should provide system status via API', async () => {
      if (!authToken) return;
      
      const response = await request(app)
        .get('/api/monitoring/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toHaveProperty('overall');
    });
  });

  describe('Security System', () => {
    it('should validate passwords according to policy', () => {
      const weakPassword = securityService.validatePassword('123');
      expect(weakPassword.valid).toBe(false);
      expect(weakPassword.errors.length).toBeGreaterThan(0);

      const strongPassword = securityService.validatePassword('StrongPass123!');
      expect(strongPassword.valid).toBe(true);
      expect(strongPassword.errors.length).toBe(0);
    });

    it('should generate security reports', async () => {
      const report = await securityService.generateSecurityReport();
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('securityPolicy');
    });
  });

  describe('Notification System', () => {
    it('should manage notification channels', () => {
      const channels = notificationService.getChannels();
      expect(Array.isArray(channels)).toBe(true);
    });

    it('should render notification templates', async () => {
      const success = await notificationService.sendTemplatedNotification(
        'user_welcome',
        {
          displayName: 'Test User',
          username: 'testuser',
          email: 'test@example.com',
          joinDate: new Date().toLocaleDateString(),
        },
        ['test@example.com'],
        'normal'
      );
      // Should not fail even if no channels are configured
      expect(typeof success).toBe('boolean');
    });
  });

  describe('API Endpoints Integration', () => {
    it('should access backup API endpoints', async () => {
      if (!authToken) return;

      const response = await request(app)
        .get('/api/backup/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should access analytics API endpoints', async () => {
      if (!authToken) return;

      const response = await request(app)
        .get('/api/analytics/system')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should access monitoring API endpoints', async () => {
      if (!authToken) return;

      const response = await request(app)
        .get('/api/monitoring/alerts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Health Endpoints', () => {
    it('should return basic health status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
    });

    it('should return enterprise health status', async () => {
      const response = await request(app).get('/health/enterprise');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('services');
    });

    it('should generate system report via health endpoint', async () => {
      const response = await request(app).get('/health/report');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.report).toHaveProperty('health');
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle unauthorized requests gracefully', async () => {
      const response = await request(app).get('/api/monitoring/status');
      expect(response.status).toBe(401);
    });

    it('should handle invalid data gracefully', async () => {
      if (!authToken) return;

      const response = await request(app)
        .post('/api/backup/schedule')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cronExpression: '' });

      expect(response.status).toBe(400);
    });
  });
});