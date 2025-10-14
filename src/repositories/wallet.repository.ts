import AppDataSource from '@/config/database';
import { Wallet } from '@/models/Wallet.entity';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';

export interface FindWalletsOptions {
  userId: string;
  skip?: number;
  take?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  chain?: string;
  search?: string;
  tag?: string;
}

export interface PaginatedWallets {
  wallets: Wallet[];
  total: number;
}

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

  async findAllPaginated(options: FindWalletsOptions): Promise<PaginatedWallets> {
    const {
      userId,
      skip = 0,
      take = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      chain,
      search,
      tag,
    } = options;

    // Build where clause
    const where: FindOptionsWhere<Wallet> = { userId };

    // Add filters
    if (chain) {
      where.chain = chain;
    }

    if (tag) {
      where.tag = ILike(`%${tag}%`);
    }

    // Build query
    const queryBuilder = this.repository.createQueryBuilder('wallet');
    queryBuilder.where('wallet.userId = :userId', { userId });

    // Apply filters
    if (chain) {
      queryBuilder.andWhere('wallet.chain = :chain', { chain });
    }

    if (tag) {
      queryBuilder.andWhere('wallet.tag ILIKE :tag', { tag: `%${tag}%` });
    }

    if (search) {
      queryBuilder.andWhere(
        '(wallet.address ILIKE :search OR wallet.tag ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply sorting
    const validSortFields = ['createdAt', 'updatedAt', 'chain', 'tag'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`wallet.${sortField}`, sortOrder);

    // Apply pagination
    queryBuilder.skip(skip);
    queryBuilder.take(take);

    // Execute query
    const [wallets, total] = await queryBuilder.getManyAndCount();

    return { wallets, total };
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

  async countByUserId(userId: string): Promise<number> {
    return this.repository.count({
      where: { userId },
    });
  }

  async countByChain(userId: string, chain: string): Promise<number> {
    return this.repository.count({
      where: { userId, chain },
    });
  }
}