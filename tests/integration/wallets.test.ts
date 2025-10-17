import request from 'supertest';
import { DataSource } from 'typeorm';
import {
  initTestDatabase,
  clearDatabase,
  generateTestEmail,
} from '../utils/test-helpers';

// Mock Redis 
const mockRedisStore = new Map<string, string>();
const mockRedisSets = new Map<string, Set<string>>();

jest.mock('../../src/config/redis.config', () => ({
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
        del: jest.fn(function(this: any, key: string) {
          if (!this._keys) this._keys = [];
          this._keys.push(key);
          return this;
        }),
        exec: jest.fn(function(this: any) {
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

beforeEach(() => {
  mockRedisStore.clear();
});

describe('Wallets Integration Tests', () => {
  let testDb: DataSource;
  let app: any;
  let authToken: string;

  beforeAll(async () => {
    testDb = await initTestDatabase();

    jest.mock('../../src/config/database', () => ({
      __esModule: true,
      default: testDb,
    }));

    app = (await import('../../src/app')).default;

    // Crear usuario UNA VEZ para todos los tests
    await clearDatabase(testDb);
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: generateTestEmail(),
        password: 'SecurePass123!',
      });

    authToken = response.body.data.token;
  });

  afterAll(async () => {
    await testDb.destroy();
  });

  beforeEach(async () => {
    // Limpiar SOLO wallets, mantener el usuario
    await testDb.query('DELETE FROM "wallets"');
  });

  describe('POST /api/wallets', () => {
    it('should create Ethereum wallet successfully', async () => {
      const response = await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chain: 'Ethereum',
          address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
          tag: 'My ETH Wallet',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Wallet created successfully');
      expect(response.body.data.chain).toBe('Ethereum');
      expect(response.body.data.address).toBe('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
      expect(response.body.data.tag).toBe('My ETH Wallet');
    });

    it('should create Bitcoin wallet successfully', async () => {
      const response = await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chain: 'Bitcoin',
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          tag: 'BTC Genesis',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.chain).toBe('Bitcoin');
    });

    it('should reject unsupported blockchain', async () => {
      const response = await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chain: 'Cardano',
          address: 'addr1...',
          tag: 'Cardano Wallet',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid Ethereum address', async () => {
      const response = await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chain: 'Ethereum',
          address: 'invalid-address',
          tag: 'Invalid Wallet',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject duplicate wallet address', async () => {
      const address = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';

      // Create first wallet
      await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chain: 'Ethereum',
          address,
          tag: 'First Wallet',
        });

      // Try to create duplicate
      const response = await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chain: 'Ethereum',
          address,
          tag: 'Duplicate Wallet',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
    });

    it('should reject wallet creation without authentication', async () => {
      const response = await request(app)
        .post('/api/wallets')
        .send({
          chain: 'Ethereum',
          address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
          tag: 'Test Wallet',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/wallets', () => {
    it('should list all user wallets', async () => {
      // Create multiple wallets
      await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chain: 'Ethereum',
          address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
          tag: 'ETH Wallet',
        });

      await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chain: 'Bitcoin',
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          tag: 'BTC Wallet',
        });

      // List wallets
      const response = await request(app)
        .get('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should filter wallets by blockchain', async () => {
      // Create wallets
      await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chain: 'Ethereum',
          address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
          tag: 'ETH Wallet',
        });

      await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chain: 'Bitcoin',
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          tag: 'BTC Wallet',
        });

      // Filter by Ethereum
      const response = await request(app)
        .get('/api/wallets?chain=Ethereum')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].chain).toBe('Ethereum');
    });

    it('should search wallets by tag', async () => {
      await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chain: 'Ethereum',
          address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
          tag: 'Main Wallet',
        });

      await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chain: 'Bitcoin',
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          tag: 'Trading Wallet',
        });

      // Search for "Main"
      const response = await request(app)
        .get('/api/wallets?search=Main')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].tag).toContain('Main');
    });

    it('should paginate wallet results', async () => {
      // Create 3 wallets
      const addresses = [
        '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
        '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      ];

      for (const address of addresses) {
        await request(app)
          .post('/api/wallets')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            chain: 'Ethereum',
            address,
            tag: `Wallet ${address}`,
          });
      }

      // Get page 1 with limit 2
      const response = await request(app)
        .get('/api/wallets?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.total).toBe(3);
      expect(response.body.pagination.hasNext).toBe(true);
    });
  });

  describe('GET /api/wallets/:id', () => {
    it('should get wallet by ID', async () => {
      const createResponse = await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chain: 'Ethereum',
          address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
          tag: 'Test Wallet',
        });

      const walletId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/wallets/${walletId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(walletId);
    });

    it('should return 404 for non-existent wallet', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .get(`/api/wallets/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/wallets/:id', () => {
    it('should update wallet tag', async () => {
      const createResponse = await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chain: 'Ethereum',
          address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
          tag: 'Original Tag',
        });

      const walletId = createResponse.body.data.id;

      const response = await request(app)
        .put(`/api/wallets/${walletId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ tag: 'Updated Tag' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tag).toBe('Updated Tag');
    });

    it('should reject update with duplicate address', async () => {
      // Create two wallets
      await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chain: 'Ethereum',
          address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
          tag: 'Wallet 1',
        });

      const wallet2Response = await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chain: 'Ethereum',
          address: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
          tag: 'Wallet 2',
        });

      // Try to update wallet2 to wallet1's address
      const response = await request(app)
        .put(`/api/wallets/${wallet2Response.body.data.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' })
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/wallets/:id', () => {
    it('should delete wallet successfully', async () => {
      const createResponse = await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chain: 'Ethereum',
          address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
          tag: 'To Delete',
        });

      const walletId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/wallets/${walletId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Wallet deleted successfully');

      // Verify it's deleted
      await request(app)
        .get(`/api/wallets/${walletId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent wallet', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .delete(`/api/wallets/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});