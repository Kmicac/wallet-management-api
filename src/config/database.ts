import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '@/models/User.entity';
import { Wallet } from '@/models/Wallet.entity';
import { config } from './env.config';

if (!config.database.host) {
  throw new Error('DB_HOST environment variable is required');
}

if (!config.database.username) {
  throw new Error('DB_USERNAME environment variable is required');
}

if (!config.database.password) {
  throw new Error('DB_PASSWORD environment variable is required');
}

if (!config.database.database) {
  throw new Error('DB_DATABASE environment variable is required');
}

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  synchronize: false, 
  logging: config.database.logging,
  entities: [User, Wallet],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: [],
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  extra: {
    max: config.database.pool.max,
    min: config.database.pool.min,
  },
};

const AppDataSource = new DataSource(dataSourceOptions);

export default AppDataSource;