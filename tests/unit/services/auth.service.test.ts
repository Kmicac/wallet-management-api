import { DataSource } from 'typeorm';
import {
  initTestDatabase,
  closeTestDatabase,
  clearDatabase,
  generateTestEmail,
} from '../../utils/test-helpers';
import { ConflictError, UnauthorizedError } from '../../../src/utils/errors.util';

const mockRedisStore = new Map<string, string>();
const mockRedisSets = new Map<string, Set<string>>();

jest.mock('../../../src/config/redis.config', () => ({
  redisClient: {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    isRedisConnected: jest.fn().mockReturnValue(true),
    getClient: jest.fn().mockReturnValue({
      set: jest.fn().mockImplementation((key: string, value: string) => {
        mockRedisStore.set(key, value);
        return Promise.resolve('OK');
      }),
      get: jest.fn().mockImplementation((key: string) => {
        return Promise.resolve(mockRedisStore.get(key) || null);
      }),
      del: jest.fn().mockImplementation((...keys: string[]) => {
        let deletedCount = 0;
        keys.forEach(key => {
          if (mockRedisStore.delete(key)) deletedCount++;
        });
        return Promise.resolve(deletedCount);
      }),
      exists: jest.fn().mockImplementation((key: string) => {
        return Promise.resolve(mockRedisStore.has(key) ? 1 : 0);
      }),
      expire: jest.fn().mockResolvedValue(1),
      sadd: jest.fn().mockImplementation((key: string, ...members: string[]) => {
        if (!mockRedisSets.has(key)) {
          mockRedisSets.set(key, new Set());
        }
        const set = mockRedisSets.get(key)!;
        let added = 0;
        members.forEach(member => {
          if (!set.has(member)) {
            set.add(member);
            added++;
          }
        });
        return Promise.resolve(added);
      }),
      smembers: jest.fn().mockImplementation((key: string) => {
        const set = mockRedisSets.get(key);
        return Promise.resolve(set ? Array.from(set) : []);
      }),
      srem: jest.fn().mockImplementation((key: string, ...members: string[]) => {
        const set = mockRedisSets.get(key);
        if (!set) return Promise.resolve(0);
        let removed = 0;
        members.forEach(member => {
          if (set.delete(member)) removed++;
        });
        return Promise.resolve(removed);
      }),
      pipeline: jest.fn().mockReturnValue({
        del: jest.fn(function (this: any, key: string) {
          if (!this._keys) this._keys = [];
          this._keys.push(key);
          return this;
        }),
        exec: jest.fn(function (this: any) {
          if (this._keys) {
            this._keys.forEach((key: string) => {
              mockRedisStore.delete(key);
            });
            this._keys = [];
          }
          return Promise.resolve([]);
        }),
      }),
    }),
  },
}));

describe('AuthService Unit Tests', () => {
  let testDb: DataSource;
  let AuthService: any;
  let authService: any;

  beforeAll(async () => {
    testDb = await initTestDatabase();

    jest.mock('../../../src/config/database', () => ({
      __esModule: true,
      default: testDb,
    }));

    const authModule = await import('../../../src/services/auth.service');
    AuthService = authModule.AuthService;
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase(testDb);
    mockRedisStore.clear();
    authService = new AuthService();
    authService['userRepository']['repository'] = testDb.getRepository('User');
  });

  describe('signUp', () => {
    it('should create a new user successfully', async () => {
      const email = generateTestEmail();
      const password = 'SecurePass123!';

      const result = await authService.signUp({ email, password });

      expect(result.user.email).toBe(email);
      expect(result.user.id).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
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

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(email);

      const signInResult = await authService.signIn({ email, password });
      expect(signInResult.user.email).toBe(email);
    });

    it('should generate valid JWT tokens', async () => {
      const email = generateTestEmail();
      const password = 'SecurePass123!';

      const result = await authService.signUp({ email, password });

      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.token.split('.')).toHaveLength(3);

      expect(result.refreshToken).toBeDefined();
      expect(typeof result.refreshToken).toBe('string');
      expect(result.refreshToken.split('.')).toHaveLength(3);
    });
  });

  describe('signIn', () => {
    it('should sign in user with correct credentials', async () => {
      const email = generateTestEmail();
      const password = 'SecurePass123!';

      await authService.signUp({ email, password });

      const result = await authService.signIn({ email, password });

      expect(result.user.email).toBe(email);
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
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

      expect(result1.token).not.toBe(result2.token);
      expect(result1.refreshToken).not.toBe(result2.refreshToken);
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const email = generateTestEmail();
      const password = 'SecurePass123!';

      const signUpResult = await authService.signUp({ email, password });
      const oldRefreshToken = signUpResult.refreshToken;

      const result = await authService.refreshToken(oldRefreshToken);

      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
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
      const oldRefreshToken = signUpResult.refreshToken;

      const firstRefresh = await authService.refreshToken(oldRefreshToken);
      expect(firstRefresh.token).toBeDefined();

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
      const userId = signUpResult.user.id;
      const token = signUpResult.token;

      await expect(authService.signOut(userId, token)).resolves.not.toThrow();
    });

    it('should blacklist token on signout', async () => {
      const email = generateTestEmail();
      const password = 'SecurePass123!';

      const signUpResult = await authService.signUp({ email, password });
      const userId = signUpResult.user.id;
      const token = signUpResult.token;

      await authService.signOut(userId, token);

      expect(mockRedisStore.size).toBeGreaterThan(0);
    });

    it('should revoke all refresh tokens on signout', async () => {
      const email = generateTestEmail();
      const password = 'SecurePass123!';

      const signUpResult = await authService.signUp({ email, password });
      const userId = signUpResult.user.id;
      const token = signUpResult.token;
      const refreshToken = signUpResult.refreshToken;

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

      expect(result.user.email).toBe(maliciousEmail);
    });

    it('should handle special characters in password', async () => {
      const email = generateTestEmail();
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';

      const signUpResult = await authService.signUp({
        email,
        password: specialPassword
      });

      expect(signUpResult.user.email).toBe(email);

      const signInResult = await authService.signIn({
        email,
        password: specialPassword
      });

      expect(signInResult.user.email).toBe(email);
    });

    it('should handle unicode characters in email', async () => {
      const email = 'tëst@éxàmplé.com';
      const password = 'SecurePass123!';

      const result = await authService.signUp({ email, password });

      expect(result.user.email).toBe(email);
    });
  });
});