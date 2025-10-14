import { ethers } from 'ethers';
import * as bitcoin from 'bitcoinjs-lib';
import { PublicKey } from '@solana/web3.js';

// Supported blockchain networks
export const SUPPORTED_CHAINS = [
  'Ethereum',
  'Bitcoin',
  'Polygon',
  'Binance Smart Chain',
  'Avalanche',
  'Arbitrum',
  'Optimism',
  'Solana',
] as const;

export type BlockchainNetwork = (typeof SUPPORTED_CHAINS)[number];

// Blockchain network configurations
export interface BlockchainConfig {
  name: BlockchainNetwork;
  symbol: string;
  chainId?: number;
  addressFormat: string;
  explorerUrl: string;
  type: 'EVM' | 'UTXO' | 'Other';
}

export const BLOCKCHAIN_CONFIGS: Record<BlockchainNetwork, BlockchainConfig> = {
  Ethereum: {
    name: 'Ethereum',
    symbol: 'ETH',
    chainId: 1,
    addressFormat: '0x + 40 hexadecimal characters',
    explorerUrl: 'https://etherscan.io',
    type: 'EVM',
  },
  Bitcoin: {
    name: 'Bitcoin',
    symbol: 'BTC',
    addressFormat: 'Base58 or Bech32',
    explorerUrl: 'https://blockchain.com',
    type: 'UTXO',
  },
  Polygon: {
    name: 'Polygon',
    symbol: 'MATIC',
    chainId: 137,
    addressFormat: '0x + 40 hexadecimal characters',
    explorerUrl: 'https://polygonscan.com',
    type: 'EVM',
  },
  'Binance Smart Chain': {
    name: 'Binance Smart Chain',
    symbol: 'BNB',
    chainId: 56,
    addressFormat: '0x + 40 hexadecimal characters',
    explorerUrl: 'https://bscscan.com',
    type: 'EVM',
  },
  Avalanche: {
    name: 'Avalanche',
    symbol: 'AVAX',
    chainId: 43114,
    addressFormat: '0x + 40 hexadecimal characters',
    explorerUrl: 'https://snowtrace.io',
    type: 'EVM',
  },
  Arbitrum: {
    name: 'Arbitrum',
    symbol: 'ARB',
    chainId: 42161,
    addressFormat: '0x + 40 hexadecimal characters',
    explorerUrl: 'https://arbiscan.io',
    type: 'EVM',
  },
  Optimism: {
    name: 'Optimism',
    symbol: 'OP',
    chainId: 10,
    addressFormat: '0x + 40 hexadecimal characters',
    explorerUrl: 'https://optimistic.etherscan.io',
    type: 'EVM',
  },
  Solana: {
    name: 'Solana',
    symbol: 'SOL',
    addressFormat: 'Base58 (32-44 characters)',
    explorerUrl: 'https://solscan.io',
    type: 'Other',
  },
};

export const CHAIN_ADDRESS_PATTERNS: Record<string, RegExp> = {
  // EVM chains (Ethereum, Polygon, BSC, Avalanche, Arbitrum, Optimism)
  Ethereum: /^0x[a-fA-F0-9]{40}$/,
  Polygon: /^0x[a-fA-F0-9]{40}$/,
  'Binance Smart Chain': /^0x[a-fA-F0-9]{40}$/,
  Avalanche: /^0x[a-fA-F0-9]{40}$/,
  Arbitrum: /^0x[a-fA-F0-9]{40}$/,
  Optimism: /^0x[a-fA-F0-9]{40}$/,

  Bitcoin: /^(1|3|bc1)[a-zA-Z0-9]{25,62}$/,

  // Solana
  Solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
};


// Validates blockchain address using appropriate library

export class BlockchainAddressValidator {

  static validateEthereumAddress(address: string): boolean {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  //  Validates Bitcoin addresses (Legacy, SegWit, Native SegWit)

  static validateBitcoinAddress(address: string): boolean {
    try {
      // Try mainnet
      bitcoin.address.toOutputScript(address, bitcoin.networks.bitcoin);
      return true;
    } catch {
      try {
        // Try testnet
        bitcoin.address.toOutputScript(address, bitcoin.networks.testnet);
        return true;
      } catch {
        return false;
      }
    }
  }


  // Validates Solana addresses

  static validateSolanaAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Main validation method - routes to specific validator
   */
  static validate(chain: string, address: string): {
    valid: boolean;
    message?: string;
    details?: string;
  } {
    // Check if chain is supported
    if (!SUPPORTED_CHAINS.includes(chain as BlockchainNetwork)) {
      return {
        valid: false,
        message: `Unsupported blockchain: ${chain}`,
        details: `Supported chains: ${SUPPORTED_CHAINS.join(', ')}`,
      };
    }

    // Get blockchain config
    const config = BLOCKCHAIN_CONFIGS[chain as BlockchainNetwork];

    // First check: Basic pattern matching
    const pattern = CHAIN_ADDRESS_PATTERNS[chain];
    if (!pattern?.test(address)) {
      return {
        valid: false,
        message: `Invalid address format for ${chain}`,
        details: `Expected format: ${config.addressFormat}`,
      };
    }

    // Second check: Deep validation with blockchain-specific libraries
    let isValid = false;

    switch (config.type) {
      case 'EVM':
        isValid = this.validateEthereumAddress(address);
        break;

      case 'UTXO':
        if (chain === 'Bitcoin') {
          isValid = this.validateBitcoinAddress(address);
        }
        break;

      case 'Other':
        if (chain === 'Solana') {
          isValid = this.validateSolanaAddress(address);
        }
        break;

      default:
        return {
          valid: false,
          message: 'Blockchain validation not implemented',
        };
    }

    if (!isValid) {
      return {
        valid: false,
        message: `Invalid ${chain} address`,
        details: `Address failed checksum validation`,
      };
    }

    return {
      valid: true,
      message: `Valid ${chain} address`,
    };
  }

  /**
   * Get blockchain information
   */
  static getBlockchainInfo(chain: string): BlockchainConfig | null {
    if (!SUPPORTED_CHAINS.includes(chain as BlockchainNetwork)) {
      return null;
    }
    return BLOCKCHAIN_CONFIGS[chain as BlockchainNetwork];
  }

  /**
   * Check if chain is EVM compatible
   */
  static isEVMChain(chain: string): boolean {
    const config = this.getBlockchainInfo(chain);
    return config?.type === 'EVM';
  }
}

/**
 * Basic pattern-based validation (for quick checks without library)
 * @deprecated Use BlockchainAddressValidator.validate() instead
 */
export const validateBlockchainAddress = (chain: string, address: string): boolean => {
  const result = BlockchainAddressValidator.validate(chain, address);
  return result.valid;
};