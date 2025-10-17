import { UserRepository } from '@/repositories/user.repository';
import { PasswordUtil } from '@/utils/password.util';
import { JwtUtil, JwtPayload } from '@/utils/jwt.util';
import { SignInDto, SignUpDto } from '@/dto/auth.dto';
import { logger } from '@/config/logger.config';
import { TokenBlacklistService } from './token-blacklist.service';
import { RefreshTokenService } from './refresh-token.service';
import { ConflictError, UnauthorizedError } from '@/utils/errors.util';

export interface AuthResult {
  user: {
    id: string;
    email: string;
  };
  token: string;
  refreshToken: string;
}

export interface RefreshResult {
  token: string;
  refreshToken: string;
}

export class AuthService {
  private userRepository: UserRepository;
  private tokenBlacklistService: TokenBlacklistService;
  private refreshTokenService: RefreshTokenService;

  constructor() {
    this.userRepository = new UserRepository();
    this.tokenBlacklistService = new TokenBlacklistService();
    this.refreshTokenService = new RefreshTokenService();
  }

  async signUp(dto: SignUpDto): Promise<AuthResult> {
    const existingUser = await this.userRepository.existsByEmail(dto.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const hashedPassword = await PasswordUtil.hash(dto.password);
    const user = await this.userRepository.create(dto.email, hashedPassword);

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
    };

    const token = JwtUtil.generateToken(payload);
    const refreshToken = JwtUtil.generateRefreshToken(payload);

    await this.refreshTokenService.storeRefreshToken(user.id, refreshToken);

    logger.info(`User registered successfully: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      token,
      refreshToken,
    };
  }

  async signIn(dto: SignInDto): Promise<AuthResult> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await PasswordUtil.compare(dto.password, user.password);
    if (!isPasswordValid) {
      logger.warn(`Failed login attempt for email: ${dto.email}`);
      throw new UnauthorizedError('Invalid email or password');
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
    };

    const token = JwtUtil.generateToken(payload);
    const refreshToken = JwtUtil.generateRefreshToken(payload);

    await this.refreshTokenService.storeRefreshToken(user.id, refreshToken);

    logger.info(`User signed in successfully: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      token,
      refreshToken,
    };
  }

  async refreshToken(oldRefreshToken: string): Promise<RefreshResult> {
    const userId = await this.refreshTokenService.verifyRefreshToken(oldRefreshToken);
    
    if (!userId) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    let payload: JwtPayload;
    try {
      payload = JwtUtil.verifyRefreshToken(oldRefreshToken);
    } catch {
      throw new UnauthorizedError('Invalid refresh token signature');
    }

    if (payload.userId !== userId) {
      throw new UnauthorizedError('Token user mismatch');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const newPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
    };

    const newToken = JwtUtil.generateToken(newPayload);
    const newRefreshToken = JwtUtil.generateRefreshToken(newPayload);

    await this.refreshTokenService.storeRefreshToken(
      user.id,
      newRefreshToken,
      oldRefreshToken
    );

    logger.info(`Tokens refreshed successfully for user: ${user.email}`);

    return {
      token: newToken,
      refreshToken: newRefreshToken,
    };
  }

  async signOut(userId: string, token: string): Promise<void> {
    await this.tokenBlacklistService.addToBlacklist(token);
    await this.refreshTokenService.revokeAllUserTokens(userId);

    logger.info(`User signed out: ${userId}`);
  }
}