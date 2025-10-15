import { BlockchainValidator } from '../../../src/validators/blockchain.validator';

describe('BlockchainValidator', () => {
  describe('validateAddress', () => {
    describe('Ethereum addresses', () => {
      it('should validate correct Ethereum address', () => {
        const result = BlockchainValidator.validateAddress(
          'Ethereum',
          '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
        );

        expect(result.valid).toBe(true);
      });

      it('should reject invalid Ethereum address format', () => {
        const result = BlockchainValidator.validateAddress(
          'Ethereum',
          'invalid-address'
        );

        expect(result.valid).toBe(false);
        expect(result.message).toContain('Invalid');
      });

      it('should reject empty address', () => {
        const result = BlockchainValidator.validateAddress('Ethereum', '');

        expect(result.valid).toBe(false);
      });
    });

    describe('Bitcoin addresses', () => {
      it('should validate correct Bitcoin Legacy address', () => {
        const result = BlockchainValidator.validateAddress(
          'Bitcoin',
          '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
        );

        expect(result.valid).toBe(true);
      });

      it('should validate correct Bitcoin SegWit address', () => {
        const result = BlockchainValidator.validateAddress(
          'Bitcoin',
          'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
        );

        expect(result.valid).toBe(true);
      });

      it('should reject invalid Bitcoin address', () => {
        const result = BlockchainValidator.validateAddress(
          'Bitcoin',
          'invalid-btc-address'
        );

        expect(result.valid).toBe(false);
      });
    });

    describe('Solana addresses', () => {
      it('should validate correct Solana address', () => {
        const result = BlockchainValidator.validateAddress(
          'Solana',
          'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK'
        );

        expect(result.valid).toBe(true);
      });

      it('should reject invalid Solana address', () => {
        const result = BlockchainValidator.validateAddress(
          'Solana',
          'invalid-sol-address'
        );

        expect(result.valid).toBe(false);
      });
    });

    describe('Unsupported chains', () => {
      it('should reject unsupported blockchain', () => {
        const result = BlockchainValidator.validateAddress(
          'Cardano',
          'addr1...'
        );

        expect(result.valid).toBe(false);
        expect(result.message).toContain('Unsupported');
      });
    });
  });

  describe('isSupportedChain', () => {
    it('should return true for Ethereum', () => {
      expect(BlockchainValidator.isSupportedChain('Ethereum')).toBe(true);
    });

    it('should return true for Bitcoin', () => {
      expect(BlockchainValidator.isSupportedChain('Bitcoin')).toBe(true);
    });

    it('should return false for Cardano', () => {
      expect(BlockchainValidator.isSupportedChain('Cardano')).toBe(false);
    });
  });

  describe('isEVMChain', () => {
    it('should return true for Ethereum', () => {
      expect(BlockchainValidator.isEVMChain('Ethereum')).toBe(true);
    });

    it('should return true for Polygon', () => {
      expect(BlockchainValidator.isEVMChain('Polygon')).toBe(true);
    });

    it('should return false for Bitcoin', () => {
      expect(BlockchainValidator.isEVMChain('Bitcoin')).toBe(false);
    });
  });

  describe('normalizeAddress', () => {
    it('should normalize Ethereum address to checksum format', () => {
      const address = '0x71c7656ec7ab88b098defb751b7401b5f6d8976f';
      const normalized = BlockchainValidator.normalizeAddress('Ethereum', address);

      expect(normalized).toBe('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
    });

    it('should return Bitcoin address unchanged', () => {
      const address = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
      const normalized = BlockchainValidator.normalizeAddress('Bitcoin', address);

      expect(normalized).toBe(address);
    });
  });

  describe('getExplorerUrl', () => {
    it('should return explorer URL for Ethereum', () => {
      const url = BlockchainValidator.getExplorerUrl(
        'Ethereum',
        '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
      );

      expect(url).toBe(
        'https://etherscan.io/address/0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
      );
    });

    it('should return null for unsupported chain', () => {
      const url = BlockchainValidator.getExplorerUrl('Cardano', 'addr1...');

      expect(url).toBeNull();
    });
  });
});