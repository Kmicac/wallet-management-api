import { PasswordUtil } from '../../../src/utils/password.util';

describe('PasswordUtil', () => {
  describe('hash', () => {
    it('should hash a password', async () => {
      const password = 'SecurePass123!';
      const hashed = await PasswordUtil.hash(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'SecurePass123!';
      const hash1 = await PasswordUtil.hash(password);
      const hash2 = await PasswordUtil.hash(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('compare', () => {
    it('should return true for correct password', async () => {
      const password = 'SecurePass123!';
      const hashed = await PasswordUtil.hash(password);
      const isMatch = await PasswordUtil.compare(password, hashed);

      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'SecurePass123!';
      const wrongPassword = 'WrongPass123!';
      const hashed = await PasswordUtil.hash(password);
      const isMatch = await PasswordUtil.compare(wrongPassword, hashed);

      expect(isMatch).toBe(false);
    });
  });
});