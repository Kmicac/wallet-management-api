import { cleanEnv, str, num, bool } from 'envalid';
import dotenv from 'dotenv';

dotenv.config();

export const env = cleanEnv(process.env, {
  // Server
  NODE_ENV: str({
    choices: ['development', 'test', 'production', 'staging'],
    default: 'development',
    desc: 'Application environment',
  }),
  PORT: num({
    default: 3000,
    desc: 'Server port',
  }),
  API_PREFIX: str({
    default: '/api',
    desc: 'API route prefix',
  }),

  // Database
  DB_HOST: str({
    desc: 'PostgreSQL host',
    example: 'localhost',
  }),
  DB_PORT: num({
    default: 5432,
    desc: 'PostgreSQL port',
  }),
  DB_USERNAME: str({
    desc: 'PostgreSQL username',
  }),
  DB_PASSWORD: str({
    desc: 'PostgreSQL password',
  }),
  DB_DATABASE: str({
    desc: 'PostgreSQL database name',
  }),
  DB_LOGGING: bool({
    default: false,
    desc: 'Enable TypeORM logging',
  }),
  DB_SSL: bool({
    default: false,
    desc: 'Enable SSL for database connection',
  }),
  DB_POOL_MAX: num({
    default: 10,
    desc: 'Maximum database connection pool size',
  }),
  DB_POOL_MIN: num({
    default: 2,
    desc: 'Minimum database connection pool size',
  }),

  // Redis
  REDIS_ENABLED: bool({
    default: true,
    desc: 'Enable Redis for caching and sessions',
  }),
  REDIS_HOST: str({
    default: 'localhost',
    desc: 'Redis host',
  }),
  REDIS_PORT: num({
    default: 6379,
    desc: 'Redis port',
  }),
  REDIS_PASSWORD: str({
    default: '',
    desc: 'Redis password (optional)',
  }),
  REDIS_DB: num({
    default: 0,
    desc: 'Redis database number',
  }),

  // JWT
  JWT_SECRET: str({
    desc: 'JWT secret for access tokens (minimum 32 characters recommended)',
    example: 'your_jwt_secret_min_32_chars_change_this',
  }),
  JWT_REFRESH_SECRET: str({
    desc: 'JWT secret for refresh tokens (minimum 32 characters recommended)',
    example: 'your_refresh_secret_min_32_chars_change_this',
  }),
  JWT_EXPIRES_IN: str({
    default: '15m',
    desc: 'Access token expiration time',
  }),
  JWT_REFRESH_EXPIRES_IN: str({
    default: '7d',
    desc: 'Refresh token expiration time',
  }),

  // Security
  BCRYPT_ROUNDS: num({
    default: 10,
    desc: 'Bcrypt hashing rounds',
  }),
  CORS_ORIGIN: str({
    default: 'http://localhost:3000',
    desc: 'Allowed CORS origins (comma-separated)',
  }),
  CORS_CREDENTIALS: bool({
    default: true,
    desc: 'Allow credentials in CORS requests',
  }),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: num({
    default: 900000, // 15 minutes
    desc: 'Rate limit time window in milliseconds',
  }),
  RATE_LIMIT_MAX_REQUESTS: num({
    default: 100,
    desc: 'Maximum requests per window',
  }),

  // Logging
  LOG_LEVEL: str({
    choices: ['error', 'warn', 'info', 'http', 'debug'],
    default: 'info',
    desc: 'Logging level',
  }),
  LOG_FILE_PATH: str({
    default: 'logs',
    desc: 'Directory for log files',
  }),
  LOG_MAX_SIZE: str({
    default: '20m',
    desc: 'Maximum size of log files',
  }),
  LOG_MAX_FILES: str({
    default: '14d',
    desc: 'Maximum age of log files',
  }),

  // Swagger
  SWAGGER_ENABLED: bool({
    default: true,
    desc: 'Enable Swagger documentation',
  }),
  SWAGGER_PATH: str({
    default: '/api-docs',
    desc: 'Swagger documentation path',
  }),
  SWAGGER_TITLE: str({
    default: 'Wallet Management API',
    desc: 'API documentation title',
  }),
  SWAGGER_DESCRIPTION: str({
    default: 'Production-ready API for managing cryptocurrency wallets',
    desc: 'API documentation description',
  }),

  // Application Settings
  MAX_WALLETS_PER_USER: num({
    default: 100,
    desc: 'Maximum wallets allowed per user',
  }),
  SUPPORTED_CHAINS: str({
    default: 'Ethereum,Bitcoin,Polygon,BSC,Solana,Avalanche',
    desc: 'Supported blockchain networks (comma-separated)',
  }),
});

// Export structured configuration
export const config = {
  // Server
  node_env: env.NODE_ENV,
  port: env.PORT,
  apiPrefix: env.API_PREFIX,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',

  // Database
  database: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_DATABASE,
    logging: env.DB_LOGGING,
    ssl: env.DB_SSL,
    pool: {
      max: env.DB_POOL_MAX,
      min: env.DB_POOL_MIN,
    },
  },

  // Redis
  redis: {
    enabled: env.REDIS_ENABLED,
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    db: env.REDIS_DB,
  },

  // JWT
  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },

  // Security
  security: {
    bcryptRounds: env.BCRYPT_ROUNDS,
    cors: {
      origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
      credentials: env.CORS_CREDENTIALS,
    },
  },

  // Rate Limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },

  // Logging
  logging: {
    level: env.LOG_LEVEL,
    filePath: env.LOG_FILE_PATH,
    maxSize: env.LOG_MAX_SIZE,
    maxFiles: env.LOG_MAX_FILES,
  },

  // Swagger
  swagger: {
    enabled: env.SWAGGER_ENABLED,
    path: env.SWAGGER_PATH,
    title: env.SWAGGER_TITLE,
    description: env.SWAGGER_DESCRIPTION,
  },

  // Application
  app: {
    maxWalletsPerUser: env.MAX_WALLETS_PER_USER,
    supportedChains: env.SUPPORTED_CHAINS.split(',').map((chain) => chain.trim()),
  },
};

// Manual validation function for sensitive values
export const validateEnv = (): void => {
  const errors: string[] = [];

  // Validate JWT secrets length
  if (env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }

  if (env.JWT_REFRESH_SECRET.length < 32) {
    errors.push('JWT_REFRESH_SECRET must be at least 32 characters long');
  }

  // Validate database credentials exist
  if (!env.DB_HOST || env.DB_HOST.trim() === '') {
    errors.push('DB_HOST is required and cannot be empty');
  }

  if (!env.DB_USERNAME || env.DB_USERNAME.trim() === '') {
    errors.push('DB_USERNAME is required and cannot be empty');
  }

  if (!env.DB_PASSWORD || env.DB_PASSWORD.trim() === '') {
    errors.push('DB_PASSWORD is required and cannot be empty');
  }

  if (!env.DB_DATABASE || env.DB_DATABASE.trim() === '') {
    errors.push('DB_DATABASE is required and cannot be empty');
  }

  // Validate bcrypt rounds range
  if (env.BCRYPT_ROUNDS < 4 || env.BCRYPT_ROUNDS > 31) {
    errors.push('BCRYPT_ROUNDS must be between 4 and 31');
  }

  // If there are validation errors, throw them all at once
  if (errors.length > 0) {
    const errorMessage = `Environment validation failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`;
    throw new Error(errorMessage);
  }
};

export { env as default };