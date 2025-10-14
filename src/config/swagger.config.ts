import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Wallet Management API',
      version: '1.0.0',
      description: 'Secure Blockchain Wallet Management API with Enterprise-Grade Security',
      contact: {
        name: 'API Support',
        email: 'support@walletapi.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.port}${env.apiPrefix}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        SignUpRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 8,
              example: 'SecurePass123!',
            },
          },
        },
        SignInRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'SecurePass123!',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Sign in successful',
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      format: 'uuid',
                    },
                    email: {
                      type: 'string',
                      format: 'email',
                    },
                  },
                },
                token: {
                  type: 'string',
                },
                refreshToken: {
                  type: 'string',
                },
              },
            },
          },
        },
        CreateWalletRequest: {
          type: 'object',
          required: ['chain', 'address'],
          properties: {
            tag: {
              type: 'string',
              example: 'My Main Wallet',
            },
            chain: {
              type: 'string',
              enum: [
                'Ethereum',
                'Bitcoin',
                'Polygon',
                'Binance Smart Chain',
                'Avalanche',
                'Arbitrum',
                'Optimism',
              ],
              example: 'Ethereum',
            },
            address: {
              type: 'string',
              example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
            },
          },
        },
        UpdateWalletRequest: {
          type: 'object',
          properties: {
            tag: {
              type: 'string',
              example: 'Updated Wallet Name',
            },
            chain: {
              type: 'string',
              example: 'Ethereum',
            },
            address: {
              type: 'string',
              example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
            },
          },
        },
        WalletResponse: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            tag: {
              type: 'string',
            },
            chain: {
              type: 'string',
            },
            address: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints',
      },
      {
        name: 'Wallets',
        description: 'Wallet management endpoints',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);