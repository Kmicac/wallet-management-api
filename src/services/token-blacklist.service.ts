import { redisClient } from '@/config/redis.config';
import { logger } from '@/config/logger.config';
import { JwtUtil } from '@/utils/jwt.util';

export class TokenBlacklistService {
  private readonly prefix = 'blacklist:';

  // Add token to blacklist
  async addToBlacklist(token: string): Promise<void> {
    try {
      const client = redisClient.getClient();

      // Decode token to get expiration
      const decoded = JwtUtil.verifyToken(token);
      const payload = decoded as any;

      if (!payload.exp) {
        logger.warn('Token has no expiration, setting default TTL');
        await client.setex(`${this.prefix}${token}`, 900, 'blacklisted'); // 15 min default
        return;
      }

      // Calculate TTL (time until token expires)
      const now = Math.floor(Date.now() / 1000);
      const ttl = payload.exp - now;

      if (ttl > 0) {
        await client.setex(`${this.prefix}${token}`, ttl, 'blacklisted');
        logger.info('Token added to blacklist');
      } else {
        logger.info('Token already expired, not adding to blacklist');
      }
    } catch (error) {
      logger.error('Error adding token to blacklist:', error);
      throw error;
    }
  }

  // Check if token is blacklisted
  async isBlacklisted(token: string): Promise<boolean> {
    try {
      const client = redisClient.getClient();
      const result = await client.get(`${this.prefix}${token}`);
      return result !== null;
    } catch (error) {
      logger.error('Error checking token blacklist:', error);
      return false;
    }
  }

  // Remove token from blacklist (mainly for testing)
  async removeFromBlacklist(token: string): Promise<void> {
    try {
      const client = redisClient.getClient();
      await client.del(`${this.prefix}${token}`);
      logger.info('Token removed from blacklist');
    } catch (error) {
      logger.error('Error removing token from blacklist:', error);
      throw error;
    }
  }
}