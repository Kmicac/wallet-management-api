import 'reflect-metadata';
import 'dotenv/config';
import app from './app';
import { env, validateEnv } from '@/config/env.config';
import { initializeDatabase, closeDatabase } from '@/config/database.init';
import { redisClient } from '@/config/redis.config';
import { logger } from '@/config/logger.config';

class Server {
  private port: number;

  constructor() {
    this.port = env.port;
  }

  async start(): Promise<void> {
    try {
      // Validate environment variables
      logger.info('🔍 Validating environment variables...');
      validateEnv();
      logger.info('✅ Environment variables validated');

      // Initialize database
      logger.info('🔌 Connecting to database...');
      await initializeDatabase();

      // Initialize Redis
      if (env.redis.enabled) {
        logger.info('🔌 Connecting to Redis...');
        await redisClient.connect();
      }

      // Start server
      app.listen(this.port, () => {
        logger.info('='.repeat(50));
        logger.info(`🚀 Server is running on port ${this.port}`);
        logger.info(`📝 Environment: ${env.node_env}`);
        logger.info(`🌐 API Base URL: http://localhost:${this.port}${env.apiPrefix}`);
        if (env.swagger.enabled) {
          logger.info(
            `📚 Swagger Docs: http://localhost:${this.port}${env.swagger.path}`
          );
        }
        if (env.redis.enabled) {
          logger.info(`🔴 Redis: ${redisClient.isRedisConnected() ? 'Connected' : 'Disconnected'}`);
        }
        logger.info('='.repeat(50));
      });

      // Graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      try {
        await closeDatabase();
        await redisClient.disconnect();
        logger.info('✅ Server shut down successfully');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason: any) => {
      logger.error('❌ Unhandled Rejection:', reason);
      shutdown('Unhandled Rejection');
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('❌ Uncaught Exception:', error);
      shutdown('Uncaught Exception');
    });
  }
}

const server = new Server();
server.start();