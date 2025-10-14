export const SUPPORTED_CHAINS = [
  'Ethereum',
  'Bitcoin',
  'Polygon',
  'Binance Smart Chain',
  'Avalanche',
  'Arbitrum',
  'Optimism',
] as const;

export type BlockchainChain = (typeof SUPPORTED_CHAINS)[number];

export const CHAIN_ADDRESS_PATTERNS: Record<string, RegExp> = {
  Ethereum: /^0x[a-fA-F0-9]{40}$/,
  Polygon: /^0x[a-fA-F0-9]{40}$/,
  'Binance Smart Chain': /^0x[a-fA-F0-9]{40}$/,
  Avalanche: /^0x[a-fA-F0-9]{40}$/,
  Arbitrum: /^0x[a-fA-F0-9]{40}$/,
  Optimism: /^0x[a-fA-F0-9]{40}$/,
  Bitcoin: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/,
};

export const validateBlockchainAddress = (chain: string, address: string): boolean => {
  const pattern = CHAIN_ADDRESS_PATTERNS[chain];
  if (!pattern) {
    return false;
  }
  return pattern.test(address);
};