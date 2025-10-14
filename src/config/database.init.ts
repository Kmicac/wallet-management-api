import AppDataSource from './database';
import { logger } from './logger.config';

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    logger.info('✅ Database connection established successfully');
    logger.info(`📊 Database: ${AppDataSource.options.database}`);
  } catch (error) {
    logger.error('❌ Error connecting to database:', error);
    process.exit(1);
  }
};

export const closeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.destroy();
    logger.info('🔌 Database connection closed');
  } catch (error) {
    logger.error('❌ Error closing database connection:', error);
  }
};