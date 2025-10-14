import { redisClient } from '@/config/redis.config';
import { logger } from '@/config/logger.config';
import { env } from '@/config/env.config';

export class RefreshTokenService {
  private readonly PREFIX = 'refresh:token:';
  private readonly USER_TOKENS_PREFIX = 'user:tokens:';

  /**
   * Store refresh token in Redis
   * Maps userId -> refreshToken with expiration
   */
  async storeRefreshToken(
    userId: string,
    refreshToken: string,
    oldRefreshToken?: string
  ): Promise<void> {
    try {
      // Parse expiration from JWT_REFRESH_EXPIRES_IN (e.g., "7d" -> 7 days in seconds)
      const expiresIn = this.parseExpiration(env.jwt.refreshExpiresIn);

      // Store the refresh token with user mapping
      const tokenKey = this.getTokenKey(refreshToken);
      await redisClient.set(tokenKey, userId, expiresIn);

      // Store user's active refresh tokens (for multi-device support)
      const userTokensKey = this.getUserTokensKey(userId);
      const userTokens = await this.getUserRefreshTokens(userId);

      // Remove old token if rotating
      if (oldRefreshToken) {
        const oldTokenKey = this.getTokenKey(oldRefreshToken);
        await redisClient.delete(oldTokenKey);

        const index = userTokens.indexOf(oldRefreshToken);
        if (index > -1) {
          userTokens.splice(index, 1);
        }
      }

      // Add new token
      userTokens.push(refreshToken);

      // Keep only last 5 refresh tokens (limit devices)
      if (userTokens.length > 5) {
        const removedToken = userTokens.shift()!;
        const removedKey = this.getTokenKey(removedToken);
        await redisClient.delete(removedKey);
      }

      // Store updated tokens list
      await redisClient.set(
        userTokensKey,
        JSON.stringify(userTokens),
        expiresIn
      );

      logger.info('Refresh token stored', { userId });
    } catch (error) {
      logger.error('Error storing refresh token:', error);
      // Don't throw - graceful degradation
    }
  }

  /**
   * Verify and get userId from refresh token
   */
  async verifyRefreshToken(refreshToken: string): Promise<string | null> {
    try {
      const tokenKey = this.getTokenKey(refreshToken);
      const userId = await redisClient.get(tokenKey);

      if (!userId) {
        logger.warn('Refresh token not found in Redis');
        return null;
      }

      return userId;
    } catch (error) {
      logger.error('Error verifying refresh token:', error);
      return null;
    }
  }

  /**
   * Revoke a specific refresh token
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      const tokenKey = this.getTokenKey(refreshToken);
      const userId = await redisClient.get(tokenKey);

      if (userId) {
        // Remove from user's token list
        const userTokens = await this.getUserRefreshTokens(userId);
        const index = userTokens.indexOf(refreshToken);
        
        if (index > -1) {
          userTokens.splice(index, 1);
          const userTokensKey = this.getUserTokensKey(userId);
          const expiresIn = this.parseExpiration(env.jwt.refreshExpiresIn);
          await redisClient.set(
            userTokensKey,
            JSON.stringify(userTokens),
            expiresIn
          );
        }
      }

      // Delete the token
      await redisClient.delete(tokenKey);
      logger.info('Refresh token revoked');
    } catch (error) {
      logger.error('Error revoking refresh token:', error);
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      const userTokens = await this.getUserRefreshTokens(userId);

      // Delete all tokens
      for (const token of userTokens) {
        const tokenKey = this.getTokenKey(token);
        await redisClient.delete(tokenKey);
      }

      // Clear user's token list
      const userTokensKey = this.getUserTokensKey(userId);
      await redisClient.delete(userTokensKey);

      logger.info('All refresh tokens revoked for user', { userId });
    } catch (error) {
      logger.error('Error revoking all user tokens:', error);
    }
  }

  /**
   * Get all refresh tokens for a user
   */
  private async getUserRefreshTokens(userId: string): Promise<string[]> {
    try {
      const userTokensKey = this.getUserTokensKey(userId);
      const tokensJson = await redisClient.get(userTokensKey);

      if (!tokensJson) {
        return [];
      }

      return JSON.parse(tokensJson);
    } catch (error) {
      logger.error('Error getting user refresh tokens:', error);
      return [];
    }
  }

  /**
   * Parse expiration string to seconds
   */
  private parseExpiration(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    
    if (!match) {
      return 7 * 24 * 60 * 60; // Default 7 days
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
        return 7 * 24 * 60 * 60;
    }
  }

  /**
   * Generate Redis key for token
   */
  private getTokenKey(token: string): string {
    // Use first 32 chars as key
    const tokenHash = token.substring(0, 32);
    return `${this.PREFIX}${tokenHash}`;
  }

  /**
   * Generate Redis key for user's tokens list
   */
  private getUserTokensKey(userId: string): string {
    return `${this.USER_TOKENS_PREFIX}${userId}`;
  }
}