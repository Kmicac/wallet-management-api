import { Response } from 'express';
import { WalletService } from '@/services/wallet.service';
import { CreateWalletDto, UpdateWalletDto } from '@/dto/wallet.dto';
import { AuthenticatedRequest } from '@/interfaces/request.interface';
import { ResponseBuilder } from '@/utils/response.builder';
import { asyncHandler } from '@/middlewares/error.middleware';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

export class WalletController {
  private walletService: WalletService;

  constructor() {
    this.walletService = new WalletService();
  }

  getAllWallets = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const wallets = await this.walletService.getAllWallets(userId);

    res.status(200).json(
      ResponseBuilder.success(wallets, 'Wallets retrieved successfully')
    );
  });

  getWalletsPaginated = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;

    const {
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      chain,
      search,
      tag,
    } = req.query;

    const result = await this.walletService.getWalletsPaginated(userId, {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      sortBy: sortBy as string,
      sortOrder: (sortOrder as string).toUpperCase() as 'ASC' | 'DESC',
      chain: chain as string | undefined,
      search: search as string | undefined,
      tag: tag as string | undefined,
    });

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    });
  });

  getWalletById = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id } = req.params;

    const wallet = await this.walletService.getWalletById(id, userId);

    res.status(200).json(
      ResponseBuilder.success(wallet, 'Wallet retrieved successfully')
    );
  });

  createWallet = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const dto = plainToClass(CreateWalletDto, req.body, { enableImplicitConversion: true });
    const errors = await validate(dto);
    
    if (errors.length > 0) {
      res.status(400).json(
        ResponseBuilder.error(
          'Validation failed',
          'VALIDATION_ERROR',
          errors.map((err) => ({
            field: err.property,
            constraints: err.constraints,
          }))
        )
      );
      return;
    }

    const wallet = await this.walletService.createWallet(userId, dto);

    res.status(201).json(
      ResponseBuilder.success(wallet, 'Wallet created successfully')
    );
  });

  updateWallet = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id } = req.params;
    const dto = plainToClass(UpdateWalletDto, req.body, { enableImplicitConversion: true });
    const errors = await validate(dto);
    
    if (errors.length > 0) {
      res.status(400).json(
        ResponseBuilder.error(
          'Validation failed',
          'VALIDATION_ERROR',
          errors.map((err) => ({
            field: err.property,
            constraints: err.constraints,
          }))
        )
      );
      return;
    }

    const wallet = await this.walletService.updateWallet(id, userId, dto);

    res.status(200).json(
      ResponseBuilder.success(wallet, 'Wallet updated successfully')
    );
  });

  deleteWallet = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id } = req.params;

    await this.walletService.deleteWallet(id, userId);

    res.status(200).json(
      ResponseBuilder.successMessage('Wallet deleted successfully')
    );
  });
}