import jwt from 'jsonwebtoken';
import { config } from '@/config/env.config';

export interface JwtPayload {
  userId: string;
  email: string;
}

export class JwtUtil {
  static generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      algorithm: 'HS512',
    });
  }

  static generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
      algorithm: 'HS512',
    });
  }

  static verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwt.secret, {
        algorithms: ['HS512'],
      }) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static verifyRefreshToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.jwt.refreshSecret, {
        algorithms: ['HS512'],
      }) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }
}