import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import rateLimit from 'express-rate-limit';
import { config } from '@/config/env.config';
import { swaggerSpec } from '@/config/swagger.config';
import { errorHandler, notFoundHandler } from '@/middlewares/error.middleware';
import { requestLogger } from '@/middlewares/logger.middleware';
import healthRoutes from '@/routes/health.routes';
import authRoutes from '@/routes/auth.routes';
import walletRoutes from '@/routes/wallet.routes';
import { logger } from '@/config/logger.config';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeSwagger();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {

    this.app.use(helmet());

    this.app.use(
      cors({
        origin: config.security.cors.origin,
        credentials: config.security.cors.credentials,
      })
    );

    this.app.use(compression());

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser());

    // Logging
    if (config.isDevelopment) {
      this.app.use(morgan('dev'));
    }
    this.app.use(requestLogger);

    // Global rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
        },
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);
  }

  private initializeRoutes(): void {

    this.app.use(healthRoutes);

    // API routes
    this.app.use(`${config.apiPrefix}/auth`, authRoutes);
    this.app.use(`${config.apiPrefix}/wallets`, walletRoutes);

    // Root endpoint with API info
    this.app.get('/', (_req, res) => {
      res.json({
        success: true,
        message: 'Wallet Management API',
        version: process.env.npm_package_version || '1.0.0',
        documentation: config.swagger.enabled ? config.swagger.path : 'disabled',
        endpoints: {
          health: '/health',
          swagger: config.swagger.enabled ? config.swagger.path : 'disabled',
          auth: {
            signup: `${config.apiPrefix}/auth/signup`,
            signin: `${config.apiPrefix}/auth/signin`,
            signout: `${config.apiPrefix}/auth/signout`,
            refresh: `${config.apiPrefix}/auth/refresh`,
          },
          wallets: {
            getAll: `${config.apiPrefix}/wallets`,
            create: `${config.apiPrefix}/wallets`,
            getById: `${config.apiPrefix}/wallets/:id`,
            update: `${config.apiPrefix}/wallets/:id`,
            delete: `${config.apiPrefix}/wallets/:id`,
          },
        },
      });
    });
  }

  private initializeSwagger(): void {
    if (config.swagger.enabled) {
      this.app.use(
        config.swagger.path,
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec, {
          customSiteTitle: config.swagger.title,
          customCss: '.swagger-ui .topbar { display: none }',
        })
      );
      logger.info(`📚 Swagger documentation enabled at ${config.swagger.path}`);
    }
  }

  private initializeErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  public getApp(): Application {
    return this.app;
  }
}

const appInstance = new App();
export default appInstance.getApp();