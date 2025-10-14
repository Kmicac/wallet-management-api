import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../models/User.entity';
import { Wallet } from '../models/Wallet.entity';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '18149188',
  database: process.env.DB_DATABASE || 'wallet_management',
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  entities: [User, Wallet],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: [],
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  extra: {
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
  },
};

const AppDataSource = new DataSource(dataSourceOptions);

export default AppDataSource;