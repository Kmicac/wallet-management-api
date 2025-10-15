import { DataSource } from 'typeorm';
import { User } from '../../src/models/User.entity';
import { Wallet } from '../../src/models/Wallet.entity';

let testDataSource: DataSource | null = null;


//  Initialize test database
export const initTestDatabase = async (): Promise<DataSource> => {
  if (testDataSource && testDataSource.isInitialized) {
    return testDataSource;
  }

  testDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5434', 10),
    username: process.env.DB_USERNAME || 'test_user',
    password: process.env.DB_PASSWORD || 'test_pass_12345',
    database: process.env.DB_DATABASE || 'wallet_test',
    entities: [User, Wallet],
    synchronize: true,
    dropSchema: false,
    logging: false,
  });

  await testDataSource.initialize();

  return testDataSource;
};


// Close test database
export const closeTestDatabase = async (): Promise<void> => {
  if (testDataSource && testDataSource.isInitialized) {
    await testDataSource.destroy();
    testDataSource = null;
  }
};


// Clear all tables (CORREGIDO - borra en orden correcto)
export const clearDatabase = async (dataSource: DataSource): Promise<void> => {
  await dataSource.query('DELETE FROM "wallets"');
  await dataSource.query('DELETE FROM "users"');
};


export const generateTestEmail = (): string => {
  return `test_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`;
};


//  Generate random Ethereum address for testing
export const generateTestEthAddress = (): string => {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
};


//  Create test user
export const createTestUser = async (
  dataSource: DataSource,
  email?: string,
  passwordHash?: string
): Promise<User> => {
  const userRepository = dataSource.getRepository(User);

  const user = userRepository.create({
    email: email || generateTestEmail(),
    password: passwordHash || '$2b$04$abcdefghijklmnopqrstuv',
  });

  return await userRepository.save(user);
};


//  Create test wallet
export const createTestWallet = async (
  dataSource: DataSource,
  userId: string,
  overrides?: Partial<Wallet>
): Promise<Wallet> => {
  const walletRepository = dataSource.getRepository(Wallet);

  const wallet = walletRepository.create({
    userId,
    chain: 'Ethereum',
    address: generateTestEthAddress(),
    tag: 'Test Wallet',
    ...overrides,
  });

  return await walletRepository.save(wallet);
};

// Wait for database to be ready
export const waitForDatabase = async (maxRetries = 10): Promise<void> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const ds = await initTestDatabase();
      await ds.query('SELECT 1');
      console.log('✅ Test database ready');
      return;
    } catch (error) {
      console.log(`⏳ Waiting for database... (${i + 1}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Database not ready after maximum retries');
};