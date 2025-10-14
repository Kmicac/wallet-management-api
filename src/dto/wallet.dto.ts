import { IsString, IsOptional, IsIn, MinLength } from 'class-validator';
import { SUPPORTED_CHAINS } from '../config/blockchain.config';

export class CreateWalletDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Tag must not be empty' })
  tag?: string;

  @IsString()
  @IsIn(SUPPORTED_CHAINS, { message: 'Invalid blockchain chain' })
  chain!: string;

  @IsString()
  @MinLength(26, { message: 'Invalid wallet address' })
  address!: string;
}

export class UpdateWalletDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Tag must not be empty' })
  tag?: string;

  @IsOptional()
  @IsString()
  @IsIn(SUPPORTED_CHAINS, { message: 'Invalid blockchain chain' })
  chain?: string;

  @IsOptional()
  @IsString()
  @MinLength(26, { message: 'Invalid wallet address' })
  address?: string;
}

export interface WalletResponse {
  id: string;
  userId: string;
  tag?: string;
  chain: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}