import { WalletRepository } from '@/repositories/wallet.repository';
import { CreateWalletDto, UpdateWalletDto, WalletResponse } from '@/dto/wallet.dto';
import { BlockchainValidator } from '@/validators/blockchain.validator';
import { logger } from '@/config/logger.config';

export class WalletService {
  private walletRepository: WalletRepository;

  constructor() {
    this.walletRepository = new WalletRepository();
  }

  async getAllWallets(userId: string): Promise<WalletResponse[]> {
    try {
      const wallets = await this.walletRepository.findAllByUserId(userId);
      return wallets.map((wallet) => this.mapToResponse(wallet));
    } catch (error) {
      logger.error('Error fetching wallets:', error);
      throw new Error('Error fetching wallets');
    }
  }

  async getWalletById(id: string, userId: string): Promise<WalletResponse | null> {
    try {
      const wallet = await this.walletRepository.findByIdAndUserId(id, userId);

      if (!wallet) {
        return null;
      }

      return this.mapToResponse(wallet);
    } catch (error) {
      logger.error('Error fetching wallet:', error);
      throw new Error('Error fetching wallet');
    }
  }

  async createWallet(
    userId: string,
    dto: CreateWalletDto
  ): Promise<{ success: boolean; message: string; data?: WalletResponse }> {
    try {
      // Validate blockchain address
      const validation = BlockchainValidator.validateAddress(dto.chain, dto.address);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.message || 'Invalid wallet address',
        };
      }

      // Check if address already exists
      const existingWallet = await this.walletRepository.existsByAddress(dto.address);
      if (existingWallet) {
        return {
          success: false,
          message: 'A wallet with this address already exists',
        };
      }

      // Create wallet
      const wallet = await this.walletRepository.create(
        userId,
        dto.chain,
        dto.address,
        dto.tag
      );

      logger.info(`Wallet created successfully: ${wallet.id} for user: ${userId}`);

      return {
        success: true,
        message: 'Wallet created successfully',
        data: this.mapToResponse(wallet),
      };
    } catch (error) {
      logger.error('Error creating wallet:', error);
      throw new Error('Error creating wallet');
    }
  }

  async updateWallet(
    id: string,
    userId: string,
    dto: UpdateWalletDto
  ): Promise<{ success: boolean; message: string; data?: WalletResponse }> {
    try {
      // Check if wallet exists and belongs to user
      const existingWallet = await this.walletRepository.findByIdAndUserId(id, userId);
      if (!existingWallet) {
        return {
          success: false,
          message: 'Wallet not found',
        };
      }

      // Validate blockchain address if provided
      if (dto.address && dto.chain) {
        const validation = BlockchainValidator.validateAddress(dto.chain, dto.address);
        if (!validation.valid) {
          return {
            success: false,
            message: validation.message || 'Invalid wallet address',
          };
        }
      }

      // Check if new address already exists (excluding current wallet)
      if (dto.address) {
        const addressExists = await this.walletRepository.existsByAddressExcludingId(
          dto.address,
          id
        );
        if (addressExists) {
          return {
            success: false,
            message: 'A wallet with this address already exists',
          };
        }
      }

      // Update wallet
      const updatedWallet = await this.walletRepository.update(id, dto);

      if (!updatedWallet) {
        return {
          success: false,
          message: 'Error updating wallet',
        };
      }

      logger.info(`Wallet updated successfully: ${id}`);

      return {
        success: true,
        message: 'Wallet updated successfully',
        data: this.mapToResponse(updatedWallet),
      };
    } catch (error) {
      logger.error('Error updating wallet:', error);
      throw new Error('Error updating wallet');
    }
  }

  async deleteWallet(
    id: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if wallet exists and belongs to user
      const existingWallet = await this.walletRepository.findByIdAndUserId(id, userId);
      if (!existingWallet) {
        return {
          success: false,
          message: 'Wallet not found',
        };
      }

      // Delete wallet
      const deleted = await this.walletRepository.delete(id);

      if (!deleted) {
        return {
          success: false,
          message: 'Error deleting wallet',
        };
      }

      logger.info(`Wallet deleted successfully: ${id}`);

      return {
        success: true,
        message: 'Wallet deleted successfully',
      };
    } catch (error) {
      logger.error('Error deleting wallet:', error);
      throw new Error('Error deleting wallet');
    }
  }

  private mapToResponse(wallet: any): WalletResponse {
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