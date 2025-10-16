import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Wallet Management API',
      version,
      description: `
# Wallet Management API

A production-ready RESTful API for managing cryptocurrency wallets across multiple blockchains.

## Features

- 🔐 **JWT Authentication** with refresh token rotation
- 💰 **Multi-blockchain Support** (Ethereum, Bitcoin, Polygon, BSC, Solana, Avalanche)
- ✅ **Real Address Validation** using blockchain-specific algorithms
- 🔄 **Token Blacklisting** with Redis
- 📄 **Pagination & Filtering**
- 🛡️ **Rate Limiting** (100 requests per 15 minutes)
- 📊 **Comprehensive Test Coverage** (Unit + Integration tests)
- 🐳 **Docker Support** with PostgreSQL and Redis

## Tech Stack

- **Runtime:** Node.js 20+ with TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL with TypeORM
- **Cache/Sessions:** Redis
- **Validation:** Class-validator
- **Testing:** Jest with Supertest
- **Documentation:** Swagger/OpenAPI 3.0

## Getting Started

1. Clone the repository
2. Copy \`.env.example\` to \`.env\` and configure
3. Run \`pnpm install\`
4. Start Docker containers: \`docker-compose up -d\`
5. Run migrations: \`pnpm migration:run\`
6. Start the server: \`pnpm dev\`

## Rate Limiting

All endpoints are rate-limited to **100 requests per 15 minutes** per IP address.

## Authentication

Most endpoints require a Bearer token in the Authorization header:

\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

Tokens expire after 15 minutes. Use the refresh token endpoint to get a new access token.
      `,
      contact: {
        name: 'API Support',
        email: 'support@walletapi.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.walletmanagement.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User unique identifier',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Wallet: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Wallet unique identifier',
              example: '987fcdeb-51a2-43f1-9876-ba9876543210',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'Owner user ID',
            },
            chain: {
              type: 'string',
              enum: ['Ethereum', 'Bitcoin', 'Polygon', 'BSC', 'Solana', 'Avalanche'],
              description: 'Blockchain network',
              example: 'Ethereum',
            },
            address: {
              type: 'string',
              description: 'Blockchain address',
              example: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
            },
            tag: {
              type: 'string',
              description: 'Custom label for the wallet',
              example: 'Main Ethereum Wallet',
              maxLength: 100,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Wallet creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
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
              description: 'Valid email address',
              example: 'newuser@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 8,
              description: 'Password (min 8 characters)',
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
        RefreshTokenRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              description: 'Valid refresh token',
              example: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
        CreateWalletRequest: {
          type: 'object',
          required: ['chain', 'address'],
          properties: {
            chain: {
              type: 'string',
              enum: ['Ethereum', 'Bitcoin', 'Polygon', 'BSC', 'Solana', 'Avalanche'],
              description: 'Blockchain network',
              example: 'Ethereum',
            },
            address: {
              type: 'string',
              description: 'Valid blockchain address',
              example: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
            },
            tag: {
              type: 'string',
              description: 'Optional custom label',
              example: 'My Main Wallet',
              maxLength: 100,
            },
          },
        },
        UpdateWalletRequest: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              description: 'New blockchain address',
              example: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
            },
            tag: {
              type: 'string',
              description: 'New custom label',
              example: 'Updated Wallet Name',
              maxLength: 100,
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
              example: 'User registered successfully',
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User',
                },
                token: {
                  type: 'string',
                  description: 'JWT access token (expires in 15 min)',
                  example: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...',
                },
                refreshToken: {
                  type: 'string',
                  description: 'Refresh token (expires in 7 days)',
                  example: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...',
                },
              },
            },
          },
        },
        WalletResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Wallet created successfully',
            },
            data: {
              $ref: '#/components/schemas/Wallet',
            },
          },
        },
        WalletListResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Wallet',
              },
            },
            pagination: {
              type: 'object',
              properties: {
                total: {
                  type: 'integer',
                  example: 42,
                },
                page: {
                  type: 'integer',
                  example: 1,
                },
                limit: {
                  type: 'integer',
                  example: 10,
                },
                totalPages: {
                  type: 'integer',
                  example: 5,
                },
                hasNext: {
                  type: 'boolean',
                  example: true,
                },
                hasPrev: {
                  type: 'boolean',
                  example: false,
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Validation failed',
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR',
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  example: ['Email must be a valid email address'],
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management',
      },
      {
        name: 'Wallets',
        description: 'Cryptocurrency wallet management operations',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);