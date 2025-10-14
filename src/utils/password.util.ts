import bcrypt from 'bcryptjs';
import { env } from '@/config/env.config';

export class PasswordUtil {
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, env.security.bcryptRounds);
  }

  static async compare(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}