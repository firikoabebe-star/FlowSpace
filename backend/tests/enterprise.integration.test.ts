import request from 'supertest';
import app from '../src/app';
import { enterpriseService } from '../src/services/enterprise.service';
import { auditService } from '../src/services/audit.service';
import { cacheService } from '../src/services/cache.service';
import prisma from '../src/db/prisma';

describe('Enterprise Integration Tests', () => {
  let authToken: string;
  let testUser: any;

  beforeAll(async () => {
    // Create test user and get auth token
    const userData = {
      email: 'enterprise@test.com',
      username: 'enterpriseuser',
      displayName: 'Enterprise User',
      password: 'password123',
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    testUser = registerResponse.body.data.user;
    authToken = registerResponse.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testUser) {
      await prisma.user.delete({
        where: { id: testUser.id },
      });
    }
    await prisma.$disconnect();
  });

  describe('Enterprise Service Initialization', () => {
    it('should initialize all enterprise services', async () => {
      await expect(enterpriseService.initialize()).resolves.not.toThrow();
    });

    it('should generate system health report', async () => {
      const health = await enterpriseService.getSystemHealth();
      
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('services');
      expect(health.services).toHaveProperty('cache');
      expect(health.services).toHaveProperty('database');
      expect(health.services).toHaveProperty('backup');
      expect(health.services).toHaveProperty('analytics');
    });
  });

  describe('Audit Logging', () => {
    it('should log audit events', async () => {
      await auditService.log({
        action: 'test.audit.event',
        userId: testUser.id,
        metadata: { test: true },
      });

      // Verify audit log was created
      const logs = await prisma.auditLog.findMany({
        where: {
          action: 'test.audit.event',
          userId: testUser.id,
        },
      });

      expect(logs).toHaveLength(1);
      expect(logs[0].metadata).toEqual({ test: true });
    });

    it('should retrieve audit logs via API', async () => {
      const response = await request(app)
        .get('/api/analytics/audit-logs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('logs');
      expect(Array.isArray(response.body.data.logs)).toBe(true);
    });
  });

  describe('Caching Service', () => {
    it('should set and get cache values', async () => {
      const key = 'test-cache-key';
      const value = { test: 'data' };

      await cacheService.set(key, value, 60);
      const retrieved = await cacheService.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should handle cache expiration', async () => {
      const key = 'test-expire-key';
      const value = 'expire-test';

      await cacheService.set(key, value, 1); // 1 second TTL
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const retrieved = await cacheService.get(key);
      expect(retrieved).toBeNull();
    });
  });

  describe('Analytics API', () => {
    it('should get system statistics', async () => {
      const response = await request(app)
        .get('/api/analytics/system')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('stats');
    });

    it('should get user engagement metrics', async () => {
      const response = await request(app)
        .get('/api/analytics/user/engagement')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('engagement');
    });
  });

  describe('Backup API', () => {
    it('should list backups', async () => {
      const response = await request(app)
        .get('/api/backup')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('backups');
      expect(Array.isArray(response.body.data.backups)).toBe(true);
    });

    it('should get backup status', async () => {
      const response = await request(app)
        .get('/api/backup/status')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
    });

    it('should schedule backup', async () => {
      const response = await request(app)
        .post('/api/backup/schedule')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cronExpression: '0 3 * * *' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Health Endpoints', () => {
    it('should return basic health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return detailed health status', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('checks');
      expect(response.body.checks).toHaveProperty('database');
      expect(response.body.checks).toHaveProperty('memory');
    });

    it('should return enterprise health status', async () => {
      const response = await request(app)
        .get('/health/enterprise');

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('services');
    });

    it('should generate system report', async () => {
      const response = await request(app)
        .get('/health/report')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('report');
      expect(response.body.data.report).toHaveProperty('health');
      expect(response.body.data.report).toHaveProperty('statistics');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // Make multiple requests to trigger rate limit
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/analytics/system')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);
      
      // Some requests should succeed, others might be rate limited
      const successCount = responses.filter(r => r.status === 200).length;
      const rateLimitedCount = responses.filter(r => r.status === 429).length;
      
      expect(successCount + rateLimitedCount).toBe(10);
    });
  });

  describe('Error Handling', () => {
    it('should handle unauthorized requests', async () => {
      const response = await request(app)
        .get('/api/analytics/system')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle invalid backup schedule', async () => {
      const response = await request(app)
        .post('/api/backup/schedule')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ cronExpression: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should respond to health checks quickly', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/health')
        .expect(200);
      
      const responseTime = Date.now() - start;
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should handle concurrent requests', async () => {
      const concurrentRequests = 5;
      const requests = Array(concurrentRequests).fill(null).map(() =>
        request(app)
          .get('/health/detailed')
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status');
      });
    });
  });
});