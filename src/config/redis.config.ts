import Redis from 'ioredis';
import { config } from './env.config';
import { logger } from './logger.config';

class RedisClient {
  private client: Redis | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    if (!config.redis.enabled) {
      logger.info('Redis is disabled');
      return;
    }

    try {
      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password || undefined,
        db: config.redis.db,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      this.client.on('error', (err: Error) => {
        logger.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('✅ Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        logger.info('✅ Redis ready to accept commands');
        this.isConnected = true;
      });

      this.client.on('close', () => {
        logger.warn('Redis connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });

      // Wait for connection to be ready
      await new Promise<void>((resolve, reject) => {
        if (!this.client) {
          reject(new Error('Redis client not initialized'));
          return;
        }

        this.client.once('ready', () => resolve());
        this.client.once('error', (err: Error) => reject(err));
      });
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('🔌 Redis disconnected');
    }
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client is not initialized. Call connect() first.');
    }
    if (!this.isConnected) {
      throw new Error('Redis client is not connected');
    }
    return this.client;
  }

  isRedisConnected(): boolean {
    return this.isConnected;
  }
}

export const redisClient = new RedisClient();