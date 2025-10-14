import { UserRepository } from '@/repositories/user.repository';
import { PasswordUtil } from '@/utils/password.util';
import { JwtUtil, JwtPayload } from '@/utils/jwt.util';
import { SignInDto, SignUpDto, AuthResponse, RefreshTokenResponse } from '@/dto/auth.dto';
import { logger } from '@/config/logger.config';
import { TokenBlacklistService } from './token-blacklist.service';
import { RefreshTokenService } from './refresh-token.service';
import {
  ConflictError,
  UnauthorizedError,
  DatabaseError,
} from '@/utils/errors.util';

export class AuthService {
  private userRepository: UserRepository;
  private tokenBlacklistService: TokenBlacklistService;
  private refreshTokenService: RefreshTokenService;

  constructor() {
    this.userRepository = new UserRepository();
    this.tokenBlacklistService = new TokenBlacklistService();
    this.refreshTokenService = new RefreshTokenService();
  }

  async signUp(dto: SignUpDto): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.existsByEmail(dto.email);
      if (existingUser) {
        throw new ConflictError('User with this email already exists');
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

      // Store refresh token
      await this.refreshTokenService.storeRefreshToken(user.id, refreshToken);

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
      if (error instanceof ConflictError) {
        throw error;
      }
      logger.error('Error during sign up:', error);
      throw new DatabaseError('Error during user registration');
    }
  }

  async signIn(dto: SignInDto): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await this.userRepository.findByEmail(dto.email);
      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await PasswordUtil.compare(dto.password, user.password);
      if (!isPasswordValid) {
        logger.warn(`Failed login attempt for email: ${dto.email}`);
        throw new UnauthorizedError('Invalid email or password');
      }

      // Generate tokens
      const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
      };

      const token = JwtUtil.generateToken(payload);
      const refreshToken = JwtUtil.generateRefreshToken(payload);

      // Store refresh token
      await this.refreshTokenService.storeRefreshToken(user.id, refreshToken);

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
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      logger.error('Error during sign in:', error);
      throw new DatabaseError('Error during sign in');
    }
  }

  async refreshToken(oldRefreshToken: string): Promise<RefreshTokenResponse> {
    try {
      // Verify refresh token exists in Redis
      const userId = await this.refreshTokenService.verifyRefreshToken(oldRefreshToken);
      
      if (!userId) {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }

      // Verify refresh token signature
      let payload: JwtPayload;
      try {
        payload = JwtUtil.verifyRefreshToken(oldRefreshToken);
      } catch {
        throw new UnauthorizedError('Invalid refresh token signature');
      }

      // Verify userId matches
      if (payload.userId !== userId) {
        throw new UnauthorizedError('Token user mismatch');
      }

      // Get user from database
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      // Generate new tokens
      const newPayload: JwtPayload = {
        userId: user.id,
        email: user.email,
      };

      const newToken = JwtUtil.generateToken(newPayload);
      const newRefreshToken = JwtUtil.generateRefreshToken(newPayload);

      // Store new refresh token and revoke old one (rotation)
      await this.refreshTokenService.storeRefreshToken(
        user.id,
        newRefreshToken,
        oldRefreshToken
      );

      logger.info(`Tokens refreshed successfully for user: ${user.email}`);

      return {
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          token: newToken,
          refreshToken: newRefreshToken,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      logger.error('Error during token refresh:', error);
      throw new DatabaseError('Error refreshing tokens');
    }
  }

  async signOut(userId: string, token: string): Promise<{ success: boolean; message: string }> {
    try {
      // Add access token to blacklist
      await this.tokenBlacklistService.addToBlacklist(token);

      // Revoke all refresh tokens for this user
      await this.refreshTokenService.revokeAllUserTokens(userId);

      logger.info(`User signed out: ${userId}`);

      return {
        success: true,
        message: 'Sign out successful',
      };
    } catch (error) {
      logger.error('Error during sign out:', error);
      throw new DatabaseError('Error during sign out');
    }
  }
}