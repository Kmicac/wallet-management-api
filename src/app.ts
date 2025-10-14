import 'reflect-metadata';
import 'dotenv/config';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { securityConfig } from '@/config/security.config';
import { env } from '@/config/env.config';
import { requestLogger } from '@/middlewares/logger.middleware';
import { errorHandler, notFoundHandler } from '@/middlewares/error.middleware';
import routes from '@/routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '@/config/swagger.config';

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
    // Security middlewares
    this.app.use(helmet(securityConfig.helmet));
    this.app.use(cors(securityConfig.cors));

    // Body parsing middlewares
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser());

    // Compression
    this.app.use(compression());

    // Logging
    if (env.node_env === 'development') {
      this.app.use(morgan('dev'));
    }
    this.app.use(requestLogger);

    // Rate limiting
    const limiter = rateLimit(securityConfig.rateLimit);
    this.app.use(limiter);

    // Trust proxy
    this.app.set('trust proxy', 1);
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use(env.apiPrefix, routes);

    // Root route
    this.app.get('/', (_req, res) => {
      res.status(200).json({
        success: true,
        message: 'Wallet Management API',
        version: '1.0.0',
        endpoints: {
          health: `${env.apiPrefix}/health`,
          docs: env.swagger.enabled ? env.swagger.path : 'disabled',
          auth: {
            signup: `${env.apiPrefix}/auth/signup`,
            signin: `${env.apiPrefix}/auth/signin`,
            signout: `${env.apiPrefix}/auth/signout`,
          },
          wallets: {
            getAll: `${env.apiPrefix}/wallets`,
            create: `${env.apiPrefix}/wallets`,
            getById: `${env.apiPrefix}/wallets/:id`,
            update: `${env.apiPrefix}/wallets/:id`,
            delete: `${env.apiPrefix}/wallets/:id`,
          },
        },
      });
    });
  }

  private initializeSwagger(): void {
    if (env.swagger.enabled) {
      this.app.use(
        env.swagger.path,
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec, {
          customSiteTitle: 'Wallet Management API Documentation',
          customCss: '.swagger-ui .topbar { display: none }',
        })
      );
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