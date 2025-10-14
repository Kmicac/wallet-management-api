import Redis from 'ioredis';
import { env } from './env.config';
import { logger } from './logger.config';

class RedisClient {
    private client: Redis | null = null;
    private isConnected: boolean = false;

    // Initialize Redis connection
    async connect(): Promise<void> {
        if (!env.redis.enabled) {
            logger.info('📴 Redis is disabled');
            return;
        }

        try {
            this.client = new Redis({
                host: env.redis.host,
                port: env.redis.port,
                password: env.redis.password || undefined,
                db: env.redis.db,
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
                maxRetriesPerRequest: 3,
            });

            this.client.on('connect', () => {
                this.isConnected = true;
                logger.info('✅ Redis connected successfully');
            });

            this.client.on('error', (error) => {
                logger.error('❌ Redis connection error:', error);
                this.isConnected = false;
            });

            this.client.on('close', () => {
                this.isConnected = false;
                logger.warn('⚠️ Redis connection closed');
            });

            // Test connection
            await this.client.ping();
        } catch (error) {
            logger.error('❌ Failed to connect to Redis:', error);
            this.client = null;
            this.isConnected = false;
        }
    }

    // Get Redis client instance
    getClient(): Redis | null {
        return this.client;
    }

    // Check if Redis is connected
    isRedisConnected(): boolean {
        return this.isConnected && this.client !== null;
    }

    // Close Redis connection
    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.quit();
            this.client = null;
            this.isConnected = false;
            logger.info('🔌 Redis disconnected');
        }
    }

    // Set a key with expiration (in seconds)
    async set(key: string, value: string, expirationInSeconds?: number): Promise<void> {
        if (!this.isRedisConnected() || !this.client) {
            logger.warn('Redis not connected, skipping set operation');
            return;
        }

        try {
            if (expirationInSeconds) {
                await this.client.setex(key, expirationInSeconds, value);
            } else {
                await this.client.set(key, value);
            }
        } catch (error) {
            logger.error('Error setting Redis key:', error);
        }
    }

    
    //  Get a key
    async get(key: string): Promise<string | null> {
        if (!this.isRedisConnected() || !this.client) {
            logger.warn('Redis not connected, skipping get operation');
            return null;
        }

        try {
            return await this.client.get(key);
        } catch (error) {
            logger.error('Error getting Redis key:', error);
            return null;
        }
    }


    //  Delete a key
    async delete(key: string): Promise<void> {
        if (!this.isRedisConnected() || !this.client) {
            logger.warn('Redis not connected, skipping delete operation');
            return;
        }

        try {
            await this.client.del(key);
        } catch (error) {
            logger.error('Error deleting Redis key:', error);
        }
    }

    //   Check if key exists
    async exists(key: string): Promise<boolean> {
        if (!this.isRedisConnected() || !this.client) {
            return false;
        }

        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            logger.error('Error checking Redis key existence:', error);
            return false;
        }
    }


    //  Set expiration on a key (in seconds)
    async expire(key: string, seconds: number): Promise<void> {
        if (!this.isRedisConnected() || !this.client) {
            return;
        }

        try {
            await this.client.expire(key, seconds);
        } catch (error) {
            logger.error('Error setting Redis key expiration:', error);
        }
    }
}

export const redisClient = new RedisClient();