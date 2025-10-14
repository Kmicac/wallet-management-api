import { cleanEnv, str, num, bool } from 'envalid';

export const validateEnv = (): void => {
  cleanEnv(process.env, {
    NODE_ENV: str({
      choices: ['development', 'test', 'production', 'staging'],
      default: 'development',
    }),
    PORT: num({ default: 3000 }),

    // Database
    DB_HOST: str(),
    DB_PORT: num({ default: 5433 }),
    DB_USERNAME: str(),
    DB_PASSWORD: str(),
    DB_DATABASE: str(),
    DB_SYNCHRONIZE: bool({ default: false }),
    DB_LOGGING: bool({ default: false }),
    DB_SSL: bool({ default: false }),
    DB_POOL_MIN: num({ default: 2 }),
    DB_POOL_MAX: num({ default: 10 }),

    // JWT - Validación de longitud se hará manualmente después
    JWT_SECRET: str(),
    JWT_REFRESH_SECRET: str(),
    JWT_EXPIRES_IN: str({ default: '15m' }),
    JWT_REFRESH_EXPIRES_IN: str({ default: '7d' }),

    // Security
    BCRYPT_ROUNDS: num({ default: 12 }),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: num({ default: 900000 }),
    RATE_LIMIT_MAX_REQUESTS: num({ default: 100 }),

    // CORS
    CORS_ORIGIN: str(),
    CORS_CREDENTIALS: bool({ default: true }),

    // Logging
    LOG_LEVEL: str({
      choices: ['error', 'warn', 'info', 'http', 'debug'],
      default: 'info',
    }),
    LOG_FILE_PATH: str({ default: './logs' }),
    LOG_MAX_FILES: str({ default: '14d' }),
    LOG_MAX_SIZE: str({ default: '20m' }),

    // Swagger
    SWAGGER_ENABLED: bool({ default: true }),
    SWAGGER_PATH: str({ default: '/api-docs' }),
  });

  // Validación manual de longitud de secrets
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long');
  }
};

export const env = {
  node_env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || '/api',

  db: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT || '5433', 10),
    username: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_DATABASE!,
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
    ssl: process.env.DB_SSL === 'true',
    poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  cors: {
    origin: process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) || [],
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
  },

  swagger: {
    enabled: process.env.SWAGGER_ENABLED === 'true',
    path: process.env.SWAGGER_PATH || '/api-docs',
  },
} as const;