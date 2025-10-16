# 💰 Wallet Management API

A production-ready RESTful API for managing cryptocurrency wallets across multiple blockchains with enterprise-grade security and scalability.

![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Node.js](https://img.shields.io/badge/Node.js-20+-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Redis](https://img.shields.io/badge/Redis-7-red)
![Test Coverage](https://img.shields.io/badge/Coverage-61%25-yellow)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🌟 Features

### Core Functionality
- ✅ **Multi-Blockchain Support**: Ethereum, Bitcoin, Polygon, BSC, Solana, Avalanche
- ✅ **Real Address Validation**: Blockchain-specific validation algorithms
- ✅ **Wallet CRUD Operations**: Create, Read, Update, Delete with full REST API
- ✅ **Advanced Filtering**: Search by blockchain, tag, and pagination support

### Security & Authentication
- 🔐 **JWT Authentication**: Access tokens (15 min) + Refresh tokens (7 days)
- 🔄 **Token Rotation**: Automatic refresh token rotation for enhanced security
- 🚫 **Token Blacklisting**: Redis-based token invalidation on logout
- 🛡️ **Intelligent Rate Limiting**: 
  - Signup: 10 attempts per 15 minutes
  - Login: 5 attempts per 15 minutes per email
  - Refresh: 10 attempts per 15 minutes
- 🔒 **bcrypt Password Hashing**: Industry-standard password encryption

### Developer Experience
- 📚 **Swagger/OpenAPI Documentation**: Interactive API docs at `/api-docs`
- 🧪 **Comprehensive Testing**: Unit + Integration tests (56 passing tests)
- 🐳 **Docker Support**: Containerized development and testing environments
- 📊 **Structured Logging**: Winston-based logging with rotation
- ⚡ **TypeScript**: Full type safety and IntelliSense support

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- pnpm (recommended) or npm
- Docker & Docker Compose (optional but recommended)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/Kmicac/wallet-management-api.git
cd wallet-management-api
```

2. **Install dependencies:**
```bash
pnpm install
```

3. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=wallet_user
DB_PASSWORD=your_secure_password
DB_DATABASE=wallet_management

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (generate secure secrets)
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars

# Security
BCRYPT_ROUNDS=10

# Swagger
SWAGGER_ENABLED=true
```

4. **Start with Docker (Recommended):**
```bash
# Start PostgreSQL + Redis
docker-compose up -d

# Run migrations
pnpm migration:run

# Start development server
pnpm dev
```

**Or without Docker:**
```bash
# Ensure PostgreSQL and Redis are running locally
pnpm migration:run
pnpm dev
```

5. **Access the API:**
- API Base URL: `http://localhost:3000`
- Swagger Docs: `http://localhost:3000/api-docs`

---

## 📖 API Documentation

### Interactive Documentation
Visit `http://localhost:3000/api-docs` for full interactive API documentation with **Try it out** functionality.

### Quick API Overview

#### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Register new user | ❌ |
| POST | `/api/auth/signin` | Sign in | ❌ |
| POST | `/api/auth/refresh` | Refresh access token | ❌ |
| POST | `/api/auth/signout` | Sign out (invalidate tokens) | ✅ |

#### Wallet Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/wallets` | Get all wallets (paginated) | ✅ |
| POST | `/api/wallets` | Create new wallet | ✅ |
| GET | `/api/wallets/:id` | Get wallet by ID | ✅ |
| PUT | `/api/wallets/:id` | Update wallet | ✅ |
| DELETE | `/api/wallets/:id` | Delete wallet | ✅ |

### Example Requests

#### 1. Sign Up
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "createdAt": "2025-10-15T10:30:00.000Z",
      "updatedAt": "2025-10-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2. Sign In
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

#### 3. Create Wallet
```bash
curl -X POST http://localhost:3000/api/wallets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "chain": "Ethereum",
    "address": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    "tag": "My Main ETH Wallet"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Wallet created successfully",
  "data": {
    "id": "987fcdeb-51a2-43f1-9876-ba9876543210",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "chain": "Ethereum",
    "address": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    "tag": "My Main ETH Wallet",
    "createdAt": "2025-10-15T10:35:00.000Z",
    "updatedAt": "2025-10-15T10:35:00.000Z"
  }
}
```

#### 4. List Wallets with Filters
```bash
curl "http://localhost:3000/api/wallets?chain=Ethereum&page=1&limit=10&search=Main" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "987fcdeb-51a2-43f1-9876-ba9876543210",
      "chain": "Ethereum",
      "address": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      "tag": "My Main ETH Wallet",
      "createdAt": "2025-10-15T10:35:00.000Z",
      "updatedAt": "2025-10-15T10:35:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### 5. Refresh Token
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9..."
  }'
```

#### 6. Update Wallet
```bash
curl -X PUT http://localhost:3000/api/wallets/987fcdeb-51a2-43f1-9876-ba9876543210 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "tag": "Updated Wallet Name"
  }'
```

#### 7. Delete Wallet
```bash
curl -X DELETE http://localhost:3000/api/wallets/987fcdeb-51a2-43f1-9876-ba9876543210 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 8. Sign Out
```bash
curl -X POST http://localhost:3000/api/auth/signout \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🧪 Testing

### Run All Tests
```bash
# Unit + Integration tests
pnpm test

# Only unit tests
pnpm test:unit

# Only integration tests
pnpm test:integration

# Watch mode
pnpm test:watch

# With coverage
pnpm test -- --coverage
```

### Test Results
```
Test Suites: 5 passed, 5 total
Tests:       56 passed, 56 total
├── Unit Tests: 29 passed
└── Integration Tests: 27 passed

Coverage: 61% overall
├── Statements: 61.46%
├── Branches: 34.66%
├── Functions: 59.7%
└── Lines: 61.59%
```

---

## 🏗️ Project Structure
```
wallet-management-api/
├── src/
│   ├── config/          # Configuration files (DB, Redis, Swagger, etc.)
│   ├── controllers/     # Route controllers
│   ├── dto/             # Data Transfer Objects with validation
│   ├── middlewares/     # Express middlewares (auth, error handling, etc.)
│   ├── models/          # TypeORM entities
│   ├── repositories/    # Database repositories
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── validators/      # Custom validators (blockchain addresses)
│   ├── app.ts           # Express app configuration
│   └── server.ts        # Server entry point
├── tests/
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── utils/           # Test utilities
├── docker-compose.yml   # Docker services
├── docker-compose.test.yml # Test environment
├── jest.config.js       # Jest configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies and scripts
```

---

## 🐳 Docker Commands
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild containers
docker-compose up -d --build

# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Clean everything
docker-compose down -v --remove-orphans
```

---

## 🔧 Development Scripts
```bash
# Development
pnpm dev              # Start with nodemon (hot reload)
pnpm build            # Build for production
pnpm start            # Start production build

# Database
pnpm migration:generate   # Generate new migration
pnpm migration:run        # Run pending migrations
pnpm migration:revert     # Revert last migration

# Code Quality
pnpm lint             # Run ESLint
pnpm format           # Format with Prettier
pnpm type-check       # TypeScript type checking

# Security
pnpm security:audit   # Run security audit
```

---

## 🔐 Supported Blockchains & Address Formats

| Blockchain | Address Format | Example |
|------------|---------------|---------|
| **Ethereum** | 0x + 40 hex chars | `0x71C7656EC7ab88b098defB751B7401B5f6d8976F` |
| **Polygon** | 0x + 40 hex chars | `0x71C7656EC7ab88b098defB751B7401B5f6d8976F` |
| **BSC** | 0x + 40 hex chars | `0x71C7656EC7ab88b098defB751B7401B5f6d8976F` |
| **Avalanche** | 0x + 40 hex chars | `0x71C7656EC7ab88b098defB751B7401B5f6d8976F` |
| **Bitcoin** | Legacy or SegWit | `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa`<br>`bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh` |
| **Solana** | Base58 (32-44 chars) | `DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK` |

---

## 🛡️ Security Best Practices

This API implements industry-standard security measures:

- ✅ **Password Hashing**: bcrypt with configurable rounds
- ✅ **JWT Tokens**: HS512 algorithm with expiration
- ✅ **Refresh Token Rotation**: One-time use refresh tokens
- ✅ **Token Blacklisting**: Immediate invalidation on logout
- ✅ **Rate Limiting**: Protection against brute-force attacks
- ✅ **Input Validation**: class-validator for all DTOs
- ✅ **SQL Injection Protection**: TypeORM parameterized queries
- ✅ **CORS**: Configurable origin restrictions
- ✅ **Helmet**: Security headers
- ✅ **Environment Variables**: Sensitive data in `.env`

---

## 📊 Architecture & Design Patterns

- **MVC Pattern**: Controllers, Services, Repositories separation
- **Repository Pattern**: Data access abstraction
- **DTO Pattern**: Request/Response validation
- **Dependency Injection**: Loose coupling between layers
- **Error Handling**: Centralized custom error classes
- **Logging**: Structured logging with Winston
- **Testing**: Unit + Integration + E2E coverage

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

### Getting Started
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Standards
- Follow existing TypeScript conventions
- Use meaningful variable and function names
- Write JSDoc comments for public APIs
- Maintain test coverage above 60%
- Run `pnpm lint` and `pnpm format` before committing

### Commit Message Format
```
type(scope): subject

body

footer
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat(auth): add refresh token rotation

Implement automatic refresh token rotation for enhanced security.
Old tokens are invalidated after use.

Closes #123
```

### Pull Request Process
1. Update README.md with details of changes if needed
2. Update API documentation in Swagger
3. Add or update tests
4. Ensure all tests pass
5. Request review from maintainers

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check if PostgreSQL is running
docker-compose ps

# Check connection settings in .env
cat .env | grep DB_

# Restart database
docker-compose restart postgres
```

#### 2. Redis Connection Failed
```bash
# Check if Redis is running
docker-compose ps

# Test Redis connection
docker-compose exec redis redis-cli ping

# Restart Redis
docker-compose restart redis
```

#### 3. Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change PORT in .env
PORT=3001
```

#### 4. Migration Errors
```bash
# Drop database and recreate
docker-compose down -v
docker-compose up -d
pnpm migration:run
```

#### 5. JWT Token Errors
```bash
# Generate new secrets
pnpm generate:secrets

# Update .env with new secrets
# Restart server
```

---

## 👤 Author

**Camilo**
- GitHub: [@Kmicac](https://github.com/Kmicac)
- Email: camilojpg30@gmail.com

---

## 🙏 Acknowledgments

- [TypeORM](https://typeorm.io/) - Amazing ORM for TypeScript
- [Express.js](https://expressjs.com/) - Fast, unopinionated web framework
- [Jest](https://jestjs.io/) - Delightful JavaScript testing
- [Swagger](https://swagger.io/) - API documentation standard
- [Docker](https://www.docker.com/) - Containerization platform
- [PostgreSQL](https://www.postgresql.org/) - The world's most advanced open source database
- [Redis](https://redis.io/) - In-memory data structure store

---

## 📞 Support

For questions or issues:
- Open an issue on GitHub
- Email: camilojpg30@gmail.com

---

**Made with ❤️ and TypeScript**