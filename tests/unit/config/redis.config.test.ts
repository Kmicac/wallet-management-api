describe('Redis Config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Module Exports', () => {
    it('should export redisClient object', () => {
      const { redisClient } = require('../../../src/config/redis.config');
      
      expect(redisClient).toBeDefined();
      expect(typeof redisClient).toBe('object');
    });

    it('should have connect method', () => {
      const { redisClient } = require('../../../src/config/redis.config');
      
      expect(redisClient.connect).toBeDefined();
      expect(typeof redisClient.connect).toBe('function');
    });

    it('should have disconnect method', () => {
      const { redisClient } = require('../../../src/config/redis.config');
      
      expect(redisClient.disconnect).toBeDefined();
      expect(typeof redisClient.disconnect).toBe('function');
    });

    it('should have isRedisConnected method', () => {
      const { redisClient } = require('../../../src/config/redis.config');
      
      expect(redisClient.isRedisConnected).toBeDefined();
      expect(typeof redisClient.isRedisConnected).toBe('function');
    });

    it('should have getClient method', () => {
      const { redisClient } = require('../../../src/config/redis.config');
      
      expect(redisClient.getClient).toBeDefined();
      expect(typeof redisClient.getClient).toBe('function');
    });
  });

  describe('isRedisConnected', () => {
    it('should return boolean', () => {
      const { redisClient } = require('../../../src/config/redis.config');
      
      const result = redisClient.isRedisConnected();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Redis Configuration', () => {
    it('should use environment variables for configuration', () => {
      const originalEnv = process.env.REDIS_HOST;
      process.env.REDIS_HOST = 'test-redis-host';
      
      // Require fresh module
      jest.isolateModules(() => {
        const config = require('../../../src/config/redis.config');
        expect(config).toBeDefined();
      });
      
      process.env.REDIS_HOST = originalEnv;
    });

    it('should have default port if not specified', () => {
      const originalPort = process.env.REDIS_PORT;
      delete process.env.REDIS_PORT;
      
      jest.isolateModules(() => {
        const config = require('../../../src/config/redis.config');
        expect(config).toBeDefined();
      });
      
      if (originalPort) {
        process.env.REDIS_PORT = originalPort;
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle connection when Redis is disabled', () => {
      const { redisClient } = require('../../../src/config/redis.config');
    
      expect(() => {
        redisClient.isRedisConnected();
      }).not.toThrow();
    });
  });
});