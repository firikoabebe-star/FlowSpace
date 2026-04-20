import { Router, Request, Response } from 'express';
import prisma from '../db/prisma';
import { socketManager } from '../socket/socket.service';
import { enterpriseService } from '../services/enterprise.service';

const router = Router();

// Basic health check
router.get('/', async (req: Request, res: Response) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    };

    res.json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

// Detailed health check
router.get('/detailed', async (req: Request, res: Response) => {
  const checks = {
    database: { status: 'unknown', responseTime: 0 },
    socket: { status: 'unknown', connections: 0 },
    memory: { status: 'unknown', usage: {} },
    disk: { status: 'unknown', usage: {} },
  };

  try {
    // Database check
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: 'healthy',
      responseTime: Date.now() - dbStart,
    };
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      responseTime: 0,
    };
  }

  // Socket.IO check
  try {
    const io = socketManager.getIO();
    checks.socket = {
      status: 'healthy',
      connections: io ? io.engine.clientsCount : 0,
    };
  } catch (error) {
    checks.socket = {
      status: 'unhealthy',
      connections: 0,
    };
  }

  // Memory check
  const memUsage = process.memoryUsage();
  const memUsageMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024),
  };

  checks.memory = {
    status: memUsageMB.heapUsed < 500 ? 'healthy' : 'warning', // Warning if > 500MB
    usage: memUsageMB,
  };

  // Overall status
  const overallStatus = Object.values(checks).every(check => 
    check.status === 'healthy'
  ) ? 'healthy' : 'degraded';

  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    checks,
  };

  const statusCode = overallStatus === 'healthy' ? 200 : 503;
  res.status(statusCode).json(response);
});

// Readiness check (for Kubernetes)
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check if database is accessible
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: 'Database not accessible',
    });
  }
});

// Liveness check (for Kubernetes)
router.get('/live', (req: Request, res: Response) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Enterprise health check
router.get('/enterprise', async (req: Request, res: Response) => {
  try {
    const health = await enterpriseService.getSystemHealth();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Enterprise health check failed',
    });
  }
});

// System report endpoint
router.get('/report', async (req: Request, res: Response) => {
  try {
    const report = await enterpriseService.generateSystemReport();
    res.json({
      success: true,
      data: { report },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate system report',
    });
  }
});

export default router;