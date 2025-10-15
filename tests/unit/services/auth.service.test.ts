import { AuthService } from '../../../src/services/auth.service';
import { UserRepository } from '../../../src/repositories/user.repository';
import { TokenBlacklistService } from '../../../src/services/token-blacklist.service';
import { RefreshTokenService } from '../../../src/services/refresh-token.service';
import { PasswordUtil } from '../../../src/utils/password.util';
import { JwtUtil } from '../../../src/utils/jwt.util';
import { logger } from '../../../src/config/logger.config';
import {
  ConflictError,
  UnauthorizedError,
  DatabaseError,
} from '../../../src/utils/errors.util';

jest.mock('@/repositories/user.repository');
jest.mock('@/services/token-blacklist.service');
jest.mock('@/services/refresh-token.service');
jest.mock('@/utils/password.util');
jest.mock('@/utils/jwt.util');
jest.mock('@/config/logger.config', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('AuthService', () => {
  let authService: AuthService;
  let userRepositoryMock: jest.Mocked<UserRepository>;
  let tokenBlacklistMock: jest.Mocked<TokenBlacklistService>;
  let refreshTokenMock: jest.Mocked<RefreshTokenService>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedpassword',
    wallets: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockToken = 'jwt-token';
  const mockRefreshToken = 'refresh-token';

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();

    // Cast a jest.Mocked
    userRepositoryMock = authService['userRepository'] as unknown as jest.Mocked<UserRepository>;
    tokenBlacklistMock = authService['tokenBlacklistService'] as unknown as jest.Mocked<TokenBlacklistService>;
    refreshTokenMock = authService['refreshTokenService'] as unknown as jest.Mocked<RefreshTokenService>;

    // Mocks de utilidades
    (PasswordUtil.hash as jest.Mock).mockResolvedValue('hashed');
    (PasswordUtil.compare as jest.Mock).mockResolvedValue(true);
    (JwtUtil.generateToken as jest.Mock).mockReturnValue(mockToken);
    (JwtUtil.generateRefreshToken as jest.Mock).mockReturnValue(mockRefreshToken);
    (JwtUtil.verifyRefreshToken as jest.Mock).mockReturnValue({ userId: '1', email: 'test@example.com' });
  });

  // signUp
  describe('signUp', () => {
    it('should register user and log info', async () => {
      userRepositoryMock.existsByEmail.mockResolvedValue(false);
      userRepositoryMock.create.mockResolvedValue(mockUser);

      const result = await authService.signUp({ email: 'test@example.com', password: '1234' });

      expect(result.success).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(`User registered successfully: ${mockUser.email}`);
      expect(userRepositoryMock.create).toHaveBeenCalledWith('test@example.com', 'hashed');
    });

    it('should throw ConflictError if email exists', async () => {
      userRepositoryMock.existsByEmail.mockResolvedValue(true);
      await expect(authService.signUp({ email: 'test@example.com', password: '1234' }))
        .rejects
        .toThrow(ConflictError);
    });

    it('should log and throw DatabaseError on unexpected error', async () => {
      userRepositoryMock.existsByEmail.mockRejectedValue(new Error('fail'));
      await expect(authService.signUp({ email: 'test@example.com', password: '1234' }))
        .rejects
        .toThrow(DatabaseError);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  // signIn
  describe('signIn', () => {
    it('should sign in successfully and log info', async () => {
      userRepositoryMock.findByEmail.mockResolvedValue(mockUser);
      const result = await authService.signIn({ email: 'test@example.com', password: '1234' });
      expect(result.success).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(`User signed in successfully: ${mockUser.email}`);
    });

    it('should warn and throw UnauthorizedError on invalid password', async () => {
      userRepositoryMock.findByEmail.mockResolvedValue(mockUser);
      (PasswordUtil.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.signIn({ email: 'test@example.com', password: '1234' }))
        .rejects
        .toThrow(UnauthorizedError);
      expect(logger.warn).toHaveBeenCalledWith(`Failed login attempt for email: test@example.com`);
    });

    it('should throw UnauthorizedError if user not found', async () => {
      userRepositoryMock.findByEmail.mockResolvedValue(null);
      await expect(authService.signIn({ email: 'test@example.com', password: '1234' }))
        .rejects
        .toThrow(UnauthorizedError);
    });
  });

  // refreshToken
  describe('refreshToken', () => {
    it('should rotate tokens successfully', async () => {
      refreshTokenMock.verifyRefreshToken.mockResolvedValue('1');
      userRepositoryMock.findById.mockResolvedValue(mockUser);

      const result = await authService.refreshToken(mockRefreshToken);
      expect(result.success).toBe(true);
      expect(refreshTokenMock.storeRefreshToken).toHaveBeenCalledWith('1', mockRefreshToken, mockRefreshToken);
      expect(logger.info).toHaveBeenCalledWith(`Tokens refreshed successfully for user: ${mockUser.email}`);
    });

    it('should throw UnauthorizedError on invalid token', async () => {
      refreshTokenMock.verifyRefreshToken.mockResolvedValue(null);
      await expect(authService.refreshToken(mockRefreshToken))
        .rejects
        .toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError on token-userId mismatch', async () => {
      refreshTokenMock.verifyRefreshToken.mockResolvedValue('2'); // mismatch
      await expect(authService.refreshToken(mockRefreshToken))
        .rejects
        .toThrow(UnauthorizedError);
    });

    it('should throw DatabaseError on unexpected error', async () => {
      refreshTokenMock.verifyRefreshToken.mockRejectedValue(new Error('fail'));
      await expect(authService.refreshToken(mockRefreshToken))
        .rejects
        .toThrow(DatabaseError);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  // signOut
  describe('signOut', () => {
    it('should sign out and log info', async () => {
      const result = await authService.signOut('1', mockToken);
      expect(result.success).toBe(true);
      expect(tokenBlacklistMock.addToBlacklist).toHaveBeenCalledWith(mockToken);
      expect(refreshTokenMock.revokeAllUserTokens).toHaveBeenCalledWith('1');
      expect(logger.info).toHaveBeenCalledWith(`User signed out: 1`);
    });

    it('should throw DatabaseError on unexpected error', async () => {
      tokenBlacklistMock.addToBlacklist.mockRejectedValue(new Error('fail'));
      await expect(authService.signOut('1', mockToken))
        .rejects
        .toThrow(DatabaseError);
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
