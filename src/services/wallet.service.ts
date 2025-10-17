import { WalletRepository } from '@/repositories/wallet.repository';
import { CreateWalletDto, UpdateWalletDto, WalletResponse } from '@/dto/wallet.dto';
import { BlockchainValidator } from '@/validators/blockchain.validator';
import { logger } from '@/config/logger.config';
import { BadRequestError, ConflictError, NotFoundError } from '@/utils/errors.util';
import { Wallet } from '@/models/Wallet.entity';

export interface GetWalletsPaginatedOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  chain?: string;
  search?: string;
  tag?: string;
}

export interface PaginatedWalletsResult {
  data: WalletResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class WalletService {
  private walletRepository: WalletRepository;

  constructor() {
    this.walletRepository = new WalletRepository();
  }


  async getAllWallets(userId: string): Promise<WalletResponse[]> {
    const wallets = await this.walletRepository.findAllByUserId(userId);
    return wallets.map((wallet) => this.mapToResponse(wallet));
  }

  async getWalletsPaginated(
    userId: string,
    query: GetWalletsPaginatedOptions
  ): Promise<PaginatedWalletsResult> {
    const { page = 1, limit = 10, sortBy, sortOrder, chain, search, tag } = query;

    const skip = (page - 1) * limit;

    const { wallets, total } = await this.walletRepository.findAllPaginated({
      userId,
      skip,
      take: limit,
      sortBy,
      sortOrder,
      chain,
      search,
      tag,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: wallets.map((wallet) => this.mapToResponse(wallet)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }


  async getWalletById(id: string, userId: string): Promise<WalletResponse> {
    const wallet = await this.walletRepository.findByIdAndUserId(id, userId);

    if (!wallet) {
      throw new NotFoundError('Wallet not found');
    }

    return this.mapToResponse(wallet);
  }

  async createWallet(userId: string, dto: CreateWalletDto): Promise<WalletResponse> {
    // Validate blockchain chain is supported
    if (!BlockchainValidator.isSupportedChain(dto.chain)) {
      throw new BadRequestError(`Unsupported blockchain: ${dto.chain}`);
    }

    // Validate blockchain address with detailed feedback
    const validation = BlockchainValidator.validateAddress(dto.chain, dto.address);
    if (!validation.valid) {
      throw new BadRequestError(validation.message);
    }

    // Normalize address (checksum for EVM chains)
    const normalizedAddress = BlockchainValidator.normalizeAddress(
      dto.chain,
      dto.address
    );

    // Check if address already exists
    const existingWallet = await this.walletRepository.existsByAddress(normalizedAddress);
    if (existingWallet) {
      throw new ConflictError('A wallet with this address already exists');
    }

    // Create wallet with normalized address
    const wallet = await this.walletRepository.create(
      userId,
      dto.chain,
      normalizedAddress,
      dto.tag
    );

    logger.info(`Wallet created successfully: ${wallet.id} for user: ${userId}`, {
      chain: dto.chain,
      address: normalizedAddress,
      explorerUrl: BlockchainValidator.getExplorerUrl(dto.chain, normalizedAddress),
    });

    return this.mapToResponse(wallet);
  }

  
  async updateWallet(
    id: string,
    userId: string,
    dto: UpdateWalletDto
  ): Promise<WalletResponse> {
    // Check if wallet exists and belongs to user
    const existingWallet = await this.walletRepository.findByIdAndUserId(id, userId);
    if (!existingWallet) {
      throw new NotFoundError('Wallet not found');
    }

    // If updating chain, validate it's supported
    if (dto.chain && !BlockchainValidator.isSupportedChain(dto.chain)) {
      throw new BadRequestError(`Unsupported blockchain: ${dto.chain}`);
    }

    // Validate blockchain address if both chain and address are provided
    if (dto.address && dto.chain) {
      const validation = BlockchainValidator.validateAddress(dto.chain, dto.address);
      if (!validation.valid) {
        throw new BadRequestError(validation.message);
      }

      // Normalize address
      dto.address = BlockchainValidator.normalizeAddress(dto.chain, dto.address);
    }

    // If only address is provided, validate against existing chain
    if (dto.address && !dto.chain) {
      const validation = BlockchainValidator.validateAddress(
        existingWallet.chain,
        dto.address
      );
      if (!validation.valid) {
        throw new BadRequestError(validation.message);
      }

      // Normalize address
      dto.address = BlockchainValidator.normalizeAddress(
        existingWallet.chain,
        dto.address
      );
    }

    if (dto.address) {
      const addressExists = await this.walletRepository.existsByAddressExcludingId(
        dto.address,
        id
      );
      if (addressExists) {
        throw new ConflictError('A wallet with this address already exists');
      }
    }

    const updatedWallet = await this.walletRepository.update(id, dto);

    if (!updatedWallet) {
      throw new Error('Error updating wallet');
    }

    logger.info(`Wallet updated successfully: ${id}`, {
      updates: dto,
    });

    return this.mapToResponse(updatedWallet);
  }


  async deleteWallet(id: string, userId: string): Promise<void> {
    const existingWallet = await this.walletRepository.findByIdAndUserId(id, userId);
    if (!existingWallet) {
      throw new NotFoundError('Wallet not found');
    }

    const deleted = await this.walletRepository.delete(id);

    if (!deleted) {
      throw new Error('Error deleting wallet');
    }

    logger.info(`Wallet deleted successfully: ${id}`, {
      chain: existingWallet.chain,
      address: existingWallet.address,
    });
  }


  private mapToResponse(wallet: Wallet): WalletResponse {
    return {
      id: wallet.id,
      userId: wallet.userId,
      tag: wallet.tag,
      chain: wallet.chain,
      address: wallet.address,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }
}