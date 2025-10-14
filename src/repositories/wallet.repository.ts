import AppDataSource from '@/config/database';
import { Wallet } from '@/models/Wallet.entity';
import { Repository } from 'typeorm';

export class WalletRepository {
  private repository: Repository<Wallet>;

  constructor() {
    this.repository = AppDataSource.getRepository(Wallet);
  }

  async findAllByUserId(userId: string): Promise<Wallet[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Wallet | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Wallet | null> {
    return this.repository.findOne({
      where: { id, userId },
    });
  }

  async findByAddress(address: string): Promise<Wallet | null> {
    return this.repository.findOne({
      where: { address },
    });
  }

  async create(
    userId: string,
    chain: string,
    address: string,
    tag?: string
  ): Promise<Wallet> {
    const wallet = this.repository.create({
      userId,
      chain,
      address,
      tag,
    });
    return this.repository.save(wallet);
  }

  async update(
    id: string,
    updates: { tag?: string; chain?: string; address?: string }
  ): Promise<Wallet | null> {
    await this.repository.update(id, updates);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async existsByAddress(address: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { address },
    });
    return count > 0;
  }

  async existsByAddressExcludingId(address: string, excludeId: string): Promise<boolean> {
    const count = await this.repository
      .createQueryBuilder('wallet')
      .where('wallet.address = :address', { address })
      .andWhere('wallet.id != :id', { id: excludeId })
      .getCount();

    return count > 0;
  }
}