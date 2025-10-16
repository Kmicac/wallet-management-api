import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '@/utils/jwt.util';
import { AuthenticatedRequest } from '@/interfaces/request.interface';
import { logger } from '@/config/logger.config';
import { TokenBlacklistService } from '@/services/token-blacklist.service';

const tokenBlacklistService = new TokenBlacklistService();

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization token is required',
        },
      });
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid authorization format',
        },
      });
      return;
    }

    // Check if token is blacklisted
    const isBlacklisted = await tokenBlacklistService.isBlacklisted(token);
    if (isBlacklisted) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_REVOKED',
          message: 'Token has been revoked',
        },
      });
      return;
    }

    // Verify token
    const payload = JwtUtil.verifyToken(token);

    (req as AuthenticatedRequest).user = {
      id: payload.userId,
      email: payload.email,
    };

    (req as any).token = token;

    next();
  } catch (error) {
    logger.warn('Authentication failed:', error);
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
      },
    });
  }
};