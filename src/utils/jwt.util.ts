import jwt from 'jsonwebtoken';
import { env } from '@/config/env.config';

export interface JwtPayload {
  userId: string;
  email: string;
}

export class JwtUtil {
  static generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.jwt.secret, {
      expiresIn: env.jwt.expiresIn,
      algorithm: 'HS512',
    });
  }

  static generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.jwt.refreshSecret, {
      expiresIn: env.jwt.refreshExpiresIn,
      algorithm: 'HS512',
    });
  }

  static verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, env.jwt.secret, {
        algorithms: ['HS512'],
      }) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static verifyRefreshToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, env.jwt.refreshSecret, {
        algorithms: ['HS512'],
      }) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }
}