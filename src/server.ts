import 'reflect-metadata';
import 'dotenv/config';
import app from './app';
import { config, validateEnv } from '@/config/env.config';
import { initializeDatabase, closeDatabase } from '@/config/database.init';
import { redisClient } from '@/config/redis.config';
import { logger } from '@/config/logger.config';

class Server {
  private port: number;

  constructor() {
    this.port = config.port;
  }

  async start(): Promise<void> {
    try {
      logger.info('🔍 Validating environment variables...');
      validateEnv();
      logger.info('✅ Environment variables validated successfully');

      logger.info('🔌 Connecting to database...');
      await initializeDatabase();

      if (config.redis.enabled) {
        logger.info('🔌 Connecting to Redis...');
        await redisClient.connect();
      }

      // Start server
      app.listen(this.port, () => {
        logger.info('='.repeat(60));
        logger.info(`🚀 Server running on port ${this.port}`);
        logger.info(`📝 Environment: ${config.node_env}`);
        logger.info(`🌐 API Base URL: http://localhost:${this.port}${config.apiPrefix}`);
        
        if (config.swagger.enabled) {
          logger.info(
            `📚 Swagger Docs: http://localhost:${this.port}${config.swagger.path}`
          );
        }
        
        if (config.redis.enabled) {
          const redisStatus = redisClient.isRedisConnected() ? '✅ Connected' : '❌ Disconnected';
          logger.info(`🔴 Redis: ${redisStatus}`);
        }
        
        logger.info('='.repeat(60));
      });

      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      try {
        await closeDatabase();
        
        if (config.redis.enabled) {
          await redisClient.disconnect();
        }
        
        logger.info('✅ Server shut down successfully');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));

    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('❌ Unhandled Rejection:', reason);
      void shutdown('Unhandled Rejection');
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('❌ Uncaught Exception:', error);
      void shutdown('Uncaught Exception');
    });
  }
}

const server = new Server();
void server.start();