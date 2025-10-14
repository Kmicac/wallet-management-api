import { UserRepository } from '@/repositories/user.repository';
import { PasswordUtil } from '@/utils/password.util';
import { JwtUtil, JwtPayload } from '@/utils/jwt.util';
import { SignInDto, SignUpDto, AuthResponse } from '@/dto/auth.dto';
import { logger } from '@/config/logger.config';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async signUp(dto: SignUpDto): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.existsByEmail(dto.email);
      if (existingUser) {
        return {
          success: false,
          message: 'User with this email already exists',
        };
      }

      // Hash password
      const hashedPassword = await PasswordUtil.hash(dto.password);

      // Create user
      const user = await this.userRepository.create(dto.email, hashedPassword);

      // Generate tokens
      const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
      };

      const token = JwtUtil.generateToken(payload);
      const refreshToken = JwtUtil.generateRefreshToken(payload);

      logger.info(`User registered successfully: ${user.email}`);

      return {
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
          },
          token,
          refreshToken,
        },
      };
    } catch (error) {
      logger.error('Error during sign up:', error);
      throw new Error('Error during user registration');
    }
  }

  async signIn(dto: SignInDto): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await this.userRepository.findByEmail(dto.email);
      if (!user) {
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      // Verify password
      const isPasswordValid = await PasswordUtil.compare(dto.password, user.password);
      if (!isPasswordValid) {
        logger.warn(`Failed login attempt for email: ${dto.email}`);
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      // Generate tokens
      const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
      };

      const token = JwtUtil.generateToken(payload);
      const refreshToken = JwtUtil.generateRefreshToken(payload);

      logger.info(`User signed in successfully: ${user.email}`);

      return {
        success: true,
        message: 'Sign in successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
          },
          token,
          refreshToken,
        },
      };
    } catch (error) {
      logger.error('Error during sign in:', error);
      throw new Error('Error during sign in');
    }
  }

  async signOut(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // In a production app, you would invalidate the token here
      // For example, add it to a blacklist in Redis
      logger.info(`User signed out: ${userId}`);

      return {
        success: true,
        message: 'Sign out successful',
      };
    } catch (error) {
      logger.error('Error during sign out:', error);
      throw new Error('Error during sign out');
    }
  }
}