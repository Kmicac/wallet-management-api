import { redisClient } from '@/config/redis.config';
import { logger } from '@/config/logger.config';
import { config } from '@/config/env.config';

export class RefreshTokenService {
  private readonly prefix = 'refresh_token:';
  private readonly userTokensPrefix = 'user_tokens:';


  // Store refresh token in Redis
  async storeRefreshToken(
    userId: string,
    refreshToken: string,
    oldRefreshToken?: string
  ): Promise<void> {
    try {
      const client = redisClient.getClient();
      const expiresIn = this.parseExpiration(config.jwt.refreshExpiresIn);

      // Store token with userId as value
      await client.setex(`${this.prefix}${refreshToken}`, expiresIn, userId);

      // Add token to user's set of tokens
      await client.sadd(`${this.userTokensPrefix}${userId}`, refreshToken);

      // If there's an old token, remove it (rotation)
      if (oldRefreshToken) {
        await this.revokeRefreshToken(oldRefreshToken);
      }

      logger.info(`Refresh token stored for user: ${userId}`);
    } catch (error) {
      logger.error('Error storing refresh token:', error);
      throw error;
    }
  }

  // Verify refresh token exists and return userId
  async verifyRefreshToken(refreshToken: string): Promise<string | null> {
    try {
      const client = redisClient.getClient();
      const userId = await client.get(`${this.prefix}${refreshToken}`);

      if (!userId) {
        logger.warn('Refresh token not found or expired');
        return null;
      }

      return userId;
    } catch (error) {
      logger.error('Error verifying refresh token:', error);
      return null;
    }
  }

  // Revoke a specific refresh token
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      const client = redisClient.getClient();

      // Get userId before deleting
      const userId = await client.get(`${this.prefix}${refreshToken}`);

      // Delete token
      await client.del(`${this.prefix}${refreshToken}`);

      // Remove from user's set
      if (userId) {
        await client.srem(`${this.userTokensPrefix}${userId}`, refreshToken);
      }

      logger.info('Refresh token revoked');
    } catch (error) {
      logger.error('Error revoking refresh token:', error);
      throw error;
    }
  }

// Revoke all refresh tokens for a user
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      const client = redisClient.getClient();

      // Get all tokens for user
      const tokens = await client.smembers(`${this.userTokensPrefix}${userId}`);

      // Delete all tokens
      if (tokens.length > 0) {
        const pipeline = client.pipeline();
        tokens.forEach((token) => {
          pipeline.del(`${this.prefix}${token}`);
        });
        await pipeline.exec();
      }

      // Delete user's token set
      await client.del(`${this.userTokensPrefix}${userId}`);

      logger.info(`All refresh tokens revoked for user: ${userId}`);
    } catch (error) {
      logger.error('Error revoking all user tokens:', error);
      throw error;
    }
  }

  private parseExpiration(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiration format: ${expiration}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        throw new Error(`Unknown time unit: ${unit}`);
    }
  }
}