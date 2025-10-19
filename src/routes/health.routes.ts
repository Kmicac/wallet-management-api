import { Router, Request, Response } from 'express';
import AppDataSource from '@/config/database';
import { redisClient } from '@/config/redis.config';
import { logger } from '@/config/logger.config';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  services: {
    database: {
      status: 'connected' | 'disconnected';
      responseTime?: number;
    };
    redis: {
      status: 'connected' | 'disconnected';
      responseTime?: number;
    };
  };
}

router.get('/health', async (_req: Request, res: Response) => {
  const startTime = Date.now();
  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: { status: 'disconnected' },
      redis: { status: 'disconnected' },
    },
  };

  // Check Database
  try {
    const dbStartTime = Date.now();
    if (AppDataSource.isInitialized) {
      await AppDataSource.query('SELECT 1');
      healthStatus.services.database = {
        status: 'connected',
        responseTime: Date.now() - dbStartTime,
      };
    } else {
      healthStatus.status = 'unhealthy';
    }
  } catch (error) {
    logger.error('Database health check failed:', error);
    healthStatus.services.database.status = 'disconnected';
    healthStatus.status = 'unhealthy';
  }

  // Check Redis
  try {
    const redisStartTime = Date.now();
    if (redisClient.isRedisConnected()) {
      const client = redisClient.getClient();
      await client.ping();
      healthStatus.services.redis = {
        status: 'connected',
        responseTime: Date.now() - redisStartTime,
      };
    } else {
      healthStatus.status = 'unhealthy';
    }
  } catch (error) {
    logger.error('Redis health check failed:', error);
    healthStatus.services.redis.status = 'disconnected';
    healthStatus.status = 'unhealthy';
  }

  const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
  const responseTime = Date.now() - startTime;

  res.status(statusCode).json({
    success: healthStatus.status === 'healthy',
    ...healthStatus,
    responseTime,
  });
});

export default router;