import { BlockchainAddressValidator } from '@/config/blockchain.config';

export interface ValidationResult {
  valid: boolean;
  message: string;
  details?: string;
}

export class BlockchainValidator {
  /**
   * Validates blockchain address with detailed feedback
   */
  static validateAddress(chain: string, address: string): ValidationResult {
    // Trim whitespace
    const trimmedAddress = address.trim();

    // Check for empty address
    if (!trimmedAddress) {
      return {
        valid: false,
        message: 'Address cannot be empty',
      };
    }

    // Use the professional validator
    const result = BlockchainAddressValidator.validate(chain, trimmedAddress);

    return {
      valid: result.valid,
      message: result.message || 'Validation completed',
      details: result.details,
    };
  }

  /**
   * Validates multiple addresses at once
   */
  static validateMultipleAddresses(
    addresses: Array<{ chain: string; address: string }>
  ): Array<ValidationResult & { chain: string; address: string }> {
    return addresses.map(({ chain, address }) => ({
      chain,
      address,
      ...this.validateAddress(chain, address),
    }));
  }

  /**
   * Check if chain is supported
   */
  static isSupportedChain(chain: string): boolean {
    return BlockchainAddressValidator.getBlockchainInfo(chain) !== null;
  }

  /**
   * Get blockchain information
   */
  static getChainInfo(chain: string) {
    return BlockchainAddressValidator.getBlockchainInfo(chain);
  }

  /**
   * Check if chain is EVM compatible
   */
  static isEVMChain(chain: string): boolean {
    return BlockchainAddressValidator.isEVMChain(chain);
  }

  /**
   * Normalize address format (lowercase for EVM chains)
   */
  static normalizeAddress(chain: string, address: string): string {
    const trimmed = address.trim();

    // EVM chains: convert to checksum address
    if (this.isEVMChain(chain)) {
      try {
        const { ethers } = require('ethers');
        return ethers.getAddress(trimmed); // Returns checksum address
      } catch {
        return trimmed;
      }
    }

    // Other chains: return as-is
    return trimmed;
  }

  /**
   * Get explorer URL for address
   */
  static getExplorerUrl(chain: string, address: string): string | null {
    const config = this.getChainInfo(chain);
    if (!config) return null;

    return `${config.explorerUrl}/address/${address}`;
  }
}