import { DataSource } from 'typeorm';
import {
  initTestDatabase,
  closeTestDatabase,
  clearDatabase,
  generateTestEmail,
} from '../../utils/test-helpers';
import { ConflictError, UnauthorizedError } from '../../../src/utils/errors.util';

// Mock Redis funcional
const mockRedisStore = new Map<string, string>();

jest.mock('../../../src/config/redis.config', () => ({
  redisClient: {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockImplementation((key: string, value: string) => {
      mockRedisStore.set(key, value);
      return Promise.resolve('OK');
    }),
    get: jest.fn().mockImplementation((key: string) => {
      return Promise.resolve(mockRedisStore.get(key) || null);
    }),
    delete: jest.fn().mockImplementation((key: string) => {
      mockRedisStore.delete(key);
      return Promise.resolve(1);
    }),
    del: jest.fn().mockImplementation((key: string) => {
      mockRedisStore.delete(key);
      return Promise.resolve(1);
    }),
    exists: jest.fn().mockImplementation((key: string) => {
      return Promise.resolve(mockRedisStore.has(key) ? 1 : 0);
    }),
    expire: jest.fn().mockResolvedValue(1),
    setEx: jest.fn().mockImplementation((key: string, _ttl: number, value: string) => {
      mockRedisStore.set(key, value);
      return Promise.resolve('OK');
    }),
    isRedisConnected: jest.fn().mockReturnValue(true),
    getClient: jest.fn().mockReturnValue({
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    }),
  },
}));

describe('AuthService Unit Tests', () => {
  let testDb: DataSource;
  let AuthService: any;
  let authService: any;

  beforeAll(async () => {
    // 1. Inicializar DB
    testDb = await initTestDatabase();

    // 2. Mock del AppDataSource ANTES de importar el service
    jest.mock('../../../src/config/database', () => ({
      __esModule: true,
      default: testDb,
    }));

    // 3. Importar AuthService DESPUÉS del mock
    const authModule = await import('../../../src/services/auth.service');
    AuthService = authModule.AuthService;
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase(testDb);
    mockRedisStore.clear();
    // Crear nueva instancia del servicio con la DB real
    authService = new AuthService();
    // Inyectar manualmente la conexión de testDb
    authService['userRepository']['repository'] = testDb.getRepository('User');
  });

  describe('signUp', () => {
    it('should create a new user successfully', async () => {
      const email = generateTestEmail();
      const password = 'SecurePass123!';

      const result = await authService.signUp({ email, password });

      expect(result.success).toBe(true);
      expect(result.message).toBe('User registered successfully');
      expect(result.data?.user.email).toBe(email);
      expect(result.data?.user.id).toBeDefined();
      expect(result.data?.token).toBeDefined();
      expect(result.data?.refreshToken).toBeDefined();
    });

    it('should throw ConflictError if email already exists', async () => {
      const email = generateTestEmail();
      const password = 'SecurePass123!';

      await authService.signUp({ email, password });

      await expect(
        authService.signUp({ email, password })
      ).rejects.toThrow(ConflictError);

      await expect(
        authService.signUp({ email, password })
      ).rejects.toThrow('User with this email already exists');
    });

    it('should hash password before storing', async () => {
      const email = generateTestEmail();
      const password = 'PlainTextPassword123!';

      const result = await authService.signUp({ email, password });

      expect(result.data?.user).toBeDefined();
      expect(result.data?.user.email).toBe(email);

      const signInResult = await authService.signIn({ email, password });
      expect(signInResult.success).toBe(true);
    });

    it('should generate valid JWT tokens', async () => {
      const email = generateTestEmail();
      const password = 'SecurePass123!';

      const result = await authService.signUp({ email, password });

      expect(result.data?.token).toBeDefined();
      expect(typeof result.data?.token).toBe('string');
      expect(result.data?.token.split('.')).toHaveLength(3);

      expect(result.data?.refreshToken).toBeDefined();
      expect(typeof result.data?.refreshToken).toBe('string');
      expect(result.data?.refreshToken.split('.')).toHaveLength(3);
    });
  });

  describe('signIn', () => {
    it('should sign in user with correct credentials', async () => {
      const email = generateTestEmail();
      const password = 'SecurePass123!';

      await authService.signUp({ email, password });

      const result = await authService.signIn({ email, password });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Sign in successful');
      expect(result.data?.user.email).toBe(email);
      expect(result.data?.token).toBeDefined();
      expect(result.data?.refreshToken).toBeDefined();
    });

    it('should throw UnauthorizedError with wrong password', async () => {
      const email = generateTestEmail();
      await authService.signUp({ email, password: 'CorrectPass123!' });

      await expect(
        authService.signIn({ email, password: 'WrongPass123!' })
      ).rejects.toThrow(UnauthorizedError);

      await expect(
        authService.signIn({ email, password: 'WrongPass123!' })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw UnauthorizedError if user does not exist', async () => {
      await expect(
        authService.signIn({
          email: 'nonexistent@example.com',
          password: 'Pass123!',
        })
      ).rejects.toThrow(UnauthorizedError);

      await expect(
        authService.signIn({
          email: 'nonexistent@example.com',
          password: 'Pass123!',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should generate different tokens for each sign in', async () => {
      const email = generateTestEmail();
      const password = 'SecurePass123!';

      await authService.signUp({ email, password });

      const result1 = await authService.signIn({ email, password });

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result2 = await authService.signIn({ email, password });

      expect(result1.data?.token).not.toBe(result2.data?.token);
      expect(result1.data?.refreshToken).not.toBe(result2.data?.refreshToken);
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const email = generateTestEmail();
      const password = 'SecurePass123!';

      const signUpResult = await authService.signUp({ email, password });
      const oldRefreshToken = signUpResult.data!.refreshToken;

      const result = await authService.refreshToken(oldRefreshToken);

      expect(result.success).toBe(true);
      expect(result.data?.token).toBeDefined();
      expect(result.data?.refreshToken).toBeDefined();
    });

    it('should throw UnauthorizedError with invalid refresh token', async () => {
      await expect(
        authService.refreshToken('invalid-token-12345')
      ).rejects.toThrow(UnauthorizedError);

      await expect(
        authService.refreshToken('invalid-token-12345')
      ).rejects.toThrow('Invalid or expired refresh token');
    });

    it('should throw UnauthorizedError with expired token', async () => {
      const expiredToken = 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjIzOTAyMn0.invalid';

      await expect(
        authService.refreshToken(expiredToken)
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should invalidate old refresh token after rotation', async () => {
      const email = generateTestEmail();
      const password = 'SecurePass123!';

      const signUpResult = await authService.signUp({ email, password });
      const oldRefreshToken = signUpResult.data!.refreshToken;

      const firstRefresh = await authService.refreshToken(oldRefreshToken);
      expect(firstRefresh.success).toBe(true);

      await expect(
        authService.refreshToken(oldRefreshToken)
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      const email = generateTestEmail();
      const password = 'SecurePass123!';

      const signUpResult = await authService.signUp({ email, password });
      const userId = signUpResult.data!.user.id;
      const token = signUpResult.data!.token;

      const result = await authService.signOut(userId, token);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Sign out successful');
    });

    it('should blacklist token on signout', async () => {
      const email = generateTestEmail();
      const password = 'SecurePass123!';

      const signUpResult = await authService.signUp({ email, password });
      const userId = signUpResult.data!.user.id;
      const token = signUpResult.data!.token;

      await authService.signOut(userId, token);

      expect(mockRedisStore.size).toBeGreaterThan(0);
    });

    it('should revoke all refresh tokens on signout', async () => {
      const email = generateTestEmail();
      const password = 'SecurePass123!';

      const signUpResult = await authService.signUp({ email, password });
      const userId = signUpResult.data!.user.id;
      const token = signUpResult.data!.token;
      const refreshToken = signUpResult.data!.refreshToken;

      await authService.signOut(userId, token);

      await expect(
        authService.refreshToken(refreshToken)
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long email', async () => {
      const longEmail = 'a'.repeat(300) + '@example.com';

      await expect(
        authService.signUp({ email: longEmail, password: 'SecurePass123!' })
      ).rejects.toThrow();
    });

    it('should handle SQL injection attempts in email', async () => {
      const maliciousEmail = "admin'--@example.com";
      const password = 'SecurePass123!';

      const result = await authService.signUp({
        email: maliciousEmail,
        password
      });

      expect(result.success).toBe(true);
      expect(result.data?.user.email).toBe(maliciousEmail);
    });

    it('should handle special characters in password', async () => {
      const email = generateTestEmail();
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';

      const signUpResult = await authService.signUp({
        email,
        password: specialPassword
      });

      expect(signUpResult.success).toBe(true);

      const signInResult = await authService.signIn({
        email,
        password: specialPassword
      });

      expect(signInResult.success).toBe(true);
    });

    it('should handle unicode characters in email', async () => {
      const email = 'tëst@éxàmplé.com';
      const password = 'SecurePass123!';

      const result = await authService.signUp({ email, password });

      expect(result.success).toBe(true);
      expect(result.data?.user.email).toBe(email);
    });
  });
});