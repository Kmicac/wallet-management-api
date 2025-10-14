import { CHAIN_ADDRESS_PATTERNS, validateBlockchainAddress } from '@/config/blockchain.config';

export class BlockchainValidator {
  static validateAddress(chain: string, address: string): { valid: boolean; message?: string } {
    const isValid = validateBlockchainAddress(chain, address);

    if (!isValid) {
      return {
        valid: false,
        message: `Invalid address format for ${chain} blockchain`,
      };
    }

    return { valid: true };
  }

  static isSupportedChain(chain: string): boolean {
    return chain in CHAIN_ADDRESS_PATTERNS;
  }
}