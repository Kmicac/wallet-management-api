import { redisClient } from '@/config/redis.config';
import { logger } from '@/config/logger.config';
import { JwtUtil } from '@/utils/jwt.util';

export class TokenBlacklistService {
  private readonly PREFIX = 'blacklist:token:';

  /**
   * Add token to blacklist
   * @param token - JWT token to blacklist
   * @param expiresIn - Time in seconds until token naturally expires
   */
  async addToBlacklist(token: string, expiresIn?: number): Promise<void> {
    try {
      // Calculate expiration if not provided
      let expiration = expiresIn;

      if (!expiration) {
        try {
          const decoded = JwtUtil.verifyToken(token);
          const now = Math.floor(Date.now() / 1000);
          expiration = (decoded as any).exp - now;
        } catch {
          // If token is already expired or invalid, use default 15 minutes
          expiration = 15 * 60;
        }
      }

      // Don't add if already expired
      if (expiration <= 0) {
        logger.debug('Token already expired, not adding to blacklist');
        return;
      }

      const key = this.getKey(token);
      await redisClient.set(key, 'revoked', expiration);
      logger.info('Token added to blacklist', { expiresIn: expiration });
    } catch (error) {
      logger.error('Error adding token to blacklist:', error);
      // Don't throw - graceful degradation
    }
  }

  /**
   * Check if token is blacklisted
   */
  async isBlacklisted(token: string): Promise<boolean> {
    try {
      const key = this.getKey(token);
      return await redisClient.exists(key);
    } catch (error) {
      logger.error('Error checking token blacklist:', error);
      // In case of error, allow the request (fail open)
      return false;
    }
  }

  /**
   * Remove token from blacklist (unlikely to be used)
   */
  async removeFromBlacklist(token: string): Promise<void> {
    try {
      const key = this.getKey(token);
      await redisClient.delete(key);
      logger.info('Token removed from blacklist');
    } catch (error) {
      logger.error('Error removing token from blacklist:', error);
    }
  }

  /**
   * Generate Redis key for token
   */
  private getKey(token: string): string {
    const tokenHash = token.substring(0, 32);
    return `${this.PREFIX}${tokenHash}`;
  }
}