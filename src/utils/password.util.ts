import bcrypt from 'bcryptjs';
import { config } from '@/config/env.config';

export class PasswordUtil {
  static async hash(password: string): Promise<string> {
    return bcrypt.hash(password, config.security.bcryptRounds);
  }

  static async compare(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}