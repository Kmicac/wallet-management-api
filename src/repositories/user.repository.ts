import AppDataSource from '@/config/database';
import { User } from '@/models/User.entity';
import { Repository } from 'typeorm';

export class UserRepository {
  private repository: Repository<User>;

  constructor() {
    this.repository = AppDataSource.getRepository(User);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'createdAt', 'updatedAt'],
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async create(email: string, hashedPassword: string): Promise<User> {
    const user = this.repository.create({
      email,
      password: hashedPassword,
    });
    return this.repository.save(user);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { email },
    });
    return count > 0;
  }
}