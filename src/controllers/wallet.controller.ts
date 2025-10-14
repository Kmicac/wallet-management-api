import { Response } from 'express';
import { WalletService } from '@/services/wallet.service';
import { CreateWalletDto, UpdateWalletDto } from '@/dto/wallet.dto';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { logger } from '@/config/logger.config';
import { AuthenticatedRequest } from '@/interfaces/request.interface';

export class WalletController {
  private walletService: WalletService;

  constructor() {
    this.walletService = new WalletService();
  }

  getAllWallets = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const wallets = await this.walletService.getAllWallets(userId);

      res.status(200).json({
        success: true,
        message: 'Wallets retrieved successfully',
        data: wallets,
      });
    } catch (error) {
      logger.error('Error in getAllWallets controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  getWalletsPaginated = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        chain,
        search,
        tag,
      } = req.query;

      const result = await this.walletService.getWalletsPaginated(userId, {
        page: Number(page),
        limit: Number(limit),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'ASC' | 'DESC',
        chain: chain as string,
        search: search as string,
        tag: tag as string,
      });

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error in getWalletsPaginated controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  getWalletById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const wallet = await this.walletService.getWalletById(id, userId);

      if (!wallet) {
        res.status(404).json({
          success: false,
          message: 'Wallet not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Wallet retrieved successfully',
        data: wallet,
      });
    } catch (error) {
      logger.error('Error in getWalletById controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  createWallet = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const dto = plainToClass(CreateWalletDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.map((err) => ({
            field: err.property,
            constraints: err.constraints,
          })),
        });
        return;
      }

      const result = await this.walletService.createWallet(userId, dto);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      logger.error('Error in createWallet controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  updateWallet = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const dto = plainToClass(UpdateWalletDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.map((err) => ({
            field: err.property,
            constraints: err.constraints,
          })),
        });
        return;
      }

      const result = await this.walletService.updateWallet(id, userId, dto);

      if (!result.success) {
        res.status(result.message === 'Wallet not found' ? 404 : 400).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error in updateWallet controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  deleteWallet = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const result = await this.walletService.deleteWallet(id, userId);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      logger.error('Error in deleteWallet controller:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
}