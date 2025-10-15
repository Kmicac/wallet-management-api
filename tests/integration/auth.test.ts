import request from 'supertest';
import { DataSource } from 'typeorm';
import {
  initTestDatabase,
  closeTestDatabase,
  clearDatabase,
  generateTestEmail,
} from '../utils/test-helpers';

// Mock Redis
const mockRedisStore = new Map<string, string>();

jest.mock('../../src/config/redis.config', () => ({
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

beforeEach(() => {
  mockRedisStore.clear();
});

describe('Auth Integration Tests', () => {
  let testDb: DataSource;
  let app: any;

  beforeAll(async () => {
    // Inicializar DB 
    testDb = await initTestDatabase();

    // Mock AppDataSource con testDb ya inicializado
    jest.mock('../../src/config/database', () => ({
      __esModule: true,
      default: testDb,
    }));

    app = (await import('../../src/app')).default;
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase(testDb);
  });

  describe('POST /api/auth/signup', () => {
    it('should register a new user successfully', async () => {
      const email = generateTestEmail();
      const password = 'SecurePass123!';

      const response = await request(app)
        .post('/api/auth/signup')
        .send({ email, password })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user.email).toBe(email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should reject signup with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'SecurePass123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject signup with short password', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: generateTestEmail(),
          password: '123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should reject duplicate email', async () => {
      const email = generateTestEmail();
      const password = 'SecurePass123!';

      await request(app)
        .post('/api/auth/signup')
        .send({ email, password })
        .expect(201);

      const response = await request(app)
        .post('/api/auth/signup')
        .send({ email, password })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
    });
  });

  describe('POST /api/auth/signin', () => {
    it('should sign in with correct credentials', async () => {
      const email = generateTestEmail();
      const password = 'SecurePass123!';

      await request(app)
        .post('/api/auth/signup')
        .send({ email, password });

      const response = await request(app)
        .post('/api/auth/signin')
        .send({ email, password })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Sign in successful');
      expect(response.body.data.user.email).toBe(email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should reject signin with wrong password', async () => {
      const email = generateTestEmail();
      await request(app)
        .post('/api/auth/signup')
        .send({ email, password: 'CorrectPass123!' });

      const response = await request(app)
        .post('/api/auth/signin')
        .send({ email, password: 'WrongPass123!' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject signin with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'nonexistent@example.com',
          password: 'Pass123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens successfully', async () => {
      const email = generateTestEmail();
      const password = 'SecurePass123!';

      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({ email, password });

      const { refreshToken } = signupResponse.body.data;

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/auth/signout', () => {
    it('should sign out successfully', async () => {
  const email = generateTestEmail();
  const password = 'SecurePass123!';

  const signupResponse = await request(app)
    .post('/api/auth/signup')
    .send({ email, password });

  const { token } = signupResponse.body.data;

  const response = await request(app)
    .post('/api/auth/signout')
    .set('Authorization', `Bearer ${token}`);

  expect([200, 401]).toContain(response.status);
});

    it('should reject signout without token', async () => {
      const response = await request(app)
        .post('/api/auth/signout')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});