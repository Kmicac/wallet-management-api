import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '@/utils/jwt.util';
import { AuthenticatedRequest } from '@/interfaces/request.interface';
import { logger } from '@/config/logger.config';

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'Authorization token is required',
      });
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Invalid authorization format',
      });
      return;
    }

    const payload = JwtUtil.verifyToken(token);

    // Attach user info to request
    (req as AuthenticatedRequest).user = {
      id: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error) {
    logger.warn('Authentication failed:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};