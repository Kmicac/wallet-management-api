describe('Database Config', () => {
  describe('Module Structure', () => {
    it('should export default AppDataSource', () => {
      const database = require('../../../src/config/database');
      
      expect(database.default).toBeDefined();
    });

    it('should export dataSourceOptions', () => {
      const { dataSourceOptions } = require('../../../src/config/database');
      
      expect(dataSourceOptions).toBeDefined();
      expect(typeof dataSourceOptions).toBe('object');
    });
  });

  describe('DataSource Configuration', () => {
    it('should have correct database type', () => {
      const { dataSourceOptions } = require('../../../src/config/database');
      
      expect(dataSourceOptions.type).toBe('postgres');
    });

    it('should include User and Wallet entities', () => {
      const { dataSourceOptions } = require('../../../src/config/database');
      
      expect(dataSourceOptions.entities).toBeDefined();
      expect(Array.isArray(dataSourceOptions.entities)).toBe(true);
      expect(dataSourceOptions.entities.length).toBeGreaterThanOrEqual(2);
    });

    it('should have synchronize set to false for safety', () => {
      const { dataSourceOptions } = require('../../../src/config/database');
      
      expect(dataSourceOptions.synchronize).toBe(false);
    });

    it('should have logging configured', () => {
      const { dataSourceOptions } = require('../../../src/config/database');
      
      expect(dataSourceOptions.logging).toBeDefined();
      expect(typeof dataSourceOptions.logging).toBe('boolean');
    });

    it('should have migrations path configured', () => {
      const { dataSourceOptions } = require('../../../src/config/database');
      
      expect(dataSourceOptions.migrations).toBeDefined();
      expect(Array.isArray(dataSourceOptions.migrations)).toBe(true);
    });

    it('should have connection pool settings', () => {
      const { dataSourceOptions } = require('../../../src/config/database');
      
      expect(dataSourceOptions.extra).toBeDefined();
      expect(dataSourceOptions.extra.max).toBeDefined();
      expect(dataSourceOptions.extra.min).toBeDefined();
      expect(typeof dataSourceOptions.extra.max).toBe('number');
      expect(typeof dataSourceOptions.extra.min).toBe('number');
    });

    it('should configure database connection from env vars', () => {
      const { dataSourceOptions } = require('../../../src/config/database');
      
      expect(dataSourceOptions.host).toBeDefined();
      expect(dataSourceOptions.port).toBeDefined();
      expect(dataSourceOptions.username).toBeDefined();
      expect(dataSourceOptions.password).toBeDefined();
      expect(dataSourceOptions.database).toBeDefined();
    });
  });

  describe('Security Settings', () => {
    it('should have SSL configuration', () => {
      const { dataSourceOptions } = require('../../../src/config/database');
      
      expect(dataSourceOptions).toHaveProperty('ssl');
    });

    it('should not have synchronize enabled in production mode', () => {
      const { dataSourceOptions } = require('../../../src/config/database');
      
      // synchronize should ALWAYS be false
      expect(dataSourceOptions.synchronize).toBe(false);
    });
  });

  describe('AppDataSource Instance', () => {
    it('should be a DataSource instance with required methods', () => {
      const AppDataSource = require('../../../src/config/database').default;
      
      expect(AppDataSource).toBeDefined();
      expect(AppDataSource).toHaveProperty('initialize');
      expect(AppDataSource).toHaveProperty('destroy');
      expect(AppDataSource).toHaveProperty('query');
      expect(AppDataSource).toHaveProperty('getRepository');
    });

    it('should have options property', () => {
      const AppDataSource = require('../../../src/config/database').default;
      
      expect(AppDataSource.options).toBeDefined();
      expect(AppDataSource.options.type).toBe('postgres');
    });
  });

  describe('Entity Registration', () => {
    it('should register User entity', () => {
      const { dataSourceOptions } = require('../../../src/config/database');
      const User = require('../../../src/models/User.entity').User;
      
      expect(dataSourceOptions.entities).toContain(User);
    });

    it('should register Wallet entity', () => {
      const { dataSourceOptions } = require('../../../src/config/database');
      const Wallet = require('../../../src/models/Wallet.entity').Wallet;
      
      expect(dataSourceOptions.entities).toContain(Wallet);
    });
  });
});