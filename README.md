# 💰 Wallet Management API

A production-ready RESTful API for managing cryptocurrency wallets across multiple blockchains with enterprise-grade security and scalability.

![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![Node.js](https://img.shields.io/badge/Node.js-20.14+-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Redis](https://img.shields.io/badge/Redis-7-red)
![Test Coverage](https://img.shields.io/badge/Coverage-68%25-yellow)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🌟 Features

### Core Functionality
- ✅ **Multi-Blockchain Support**: Ethereum, Bitcoin, Polygon, BSC, Solana, Avalanche
- ✅ **Real Address Validation**: Blockchain-specific validation algorithms
- ✅ **Wallet CRUD Operations**: Create, Read, Update, Delete with full REST API
- ✅ **Advanced Filtering**: Search by blockchain, tag, and pagination support
- ✅ **Robust Health Checks**: Database and Redis connection monitoring

### Security & Authentication
- 🔐 **JWT Authentication**: Access tokens (15 min) + Refresh tokens (7 days)
- 🔄 **Token Rotation**: Automatic refresh token rotation for enhanced security
- 🚫 **Token Blacklisting**: Redis-based token invalidation on logout
- 🛡️ **Multi-Layer Rate Limiting**: 
  - Global: 100 requests per 15 minutes per IP
  - Signup: 10 attempts per 15 minutes per IP
  - Login: 5 attempts per 15 minutes per email/IP combination
  - Refresh: 10 attempts per 15 minutes per IP
  - Wallets: 50 requests per 15 minutes per authenticated user
- 🔒 **bcrypt Password Hashing**: Industry-standard password encryption (10 rounds)

### Developer Experience
- 📚 **Swagger/OpenAPI Documentation**: Interactive API docs at `/api-docs`
- 🧪 **Comprehensive Testing**: Unit + Integration tests (95 passing tests)
- 🐳 **Docker Support**: Multi-stage builds with security best practices
- 📊 **Structured Logging**: Winston-based logging with rotation
- ⚡ **TypeScript**: Full type safety and IntelliSense support
- 🏗️ **Clean Architecture**: Modular design with separation of concerns

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20.14.0+
- pnpm 10.10.0+
- PostgreSQL 16+
- Redis 7+
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
API_PREFIX=/api

# Database
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=wallet_user
DB_PASSWORD=your_secure_password
DB_DATABASE=wallet_management

# Redis
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT (generate secure secrets with: pnpm generate:secrets)
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Swagger
SWAGGER_ENABLED=true
SWAGGER_PATH=/api-docs
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
- Health Check: `http://localhost:3000/health`
- Swagger Docs: `http://localhost:3000/api-docs`

---

## 📖 API Documentation

### Interactive Documentation
Visit `http://localhost:3000/api-docs` for full interactive API documentation with **Try it out** functionality.

### Health Check
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-10-19T10:30:00.000Z",
  "uptime": 123.45,
  "environment": "development",
  "version": "1.0.0",
  "services": {
    "database": {
      "status": "connected",
      "responseTime": 12
    },
    "redis": {
      "status": "connected",
      "responseTime": 4
    }
  },
  "responseTime": 18
}
```

### Quick API Overview

#### Authentication Endpoints

| Method | Endpoint | Description | Rate Limit | Auth Required |
|--------|----------|-------------|------------|---------------|
| POST | `/api/auth/signup` | Register new user | 10/15min | ❌ |
| POST | `/api/auth/signin` | Sign in | 5/15min per email | ❌ |
| POST | `/api/auth/refresh` | Refresh access token | 10/15min | ❌ |
| POST | `/api/auth/signout` | Sign out (invalidate tokens) | - | ✅ |

#### Wallet Endpoints

| Method | Endpoint | Description | Rate Limit | Auth Required |
|--------|----------|-------------|------------|---------------|
| GET | `/api/wallets` | Get all wallets (paginated) | 50/15min per user | ✅ |
| POST | `/api/wallets` | Create new wallet | 50/15min per user | ✅ |
| GET | `/api/wallets/:id` | Get wallet by ID | 50/15min per user | ✅ |
| PUT | `/api/wallets/:id` | Update wallet | 50/15min per user | ✅ |
| DELETE | `/api/wallets/:id` | Delete wallet | 50/15min per user | ✅ |

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
      "email": "user@example.com"
    },
    "token": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2025-10-19T10:30:00.000Z"
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
    "createdAt": "2025-10-19T10:35:00.000Z",
    "updatedAt": "2025-10-19T10:35:00.000Z"
  },
  "timestamp": "2025-10-19T10:35:00.000Z"
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
      "createdAt": "2025-10-19T10:35:00.000Z",
      "updatedAt": "2025-10-19T10:35:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "timestamp": "2025-10-19T10:35:00.000Z"
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
Test Suites: 6 passed, 6 total
Tests:       95 passed, 95 total
├── Unit Tests: 68 passed
│   ├── Auth Service: 19 tests
│   ├── Password Utils: 4 tests
│   ├── JWT Utils: 6 tests
│   ├── Blockchain Validator: 25 tests
│   ├── Redis Config: 9 tests
│   └── Database Config: 15 tests
└── Integration Tests: 27 passed
    ├── Auth Endpoints: 11 tests
    └── Wallet Endpoints: 16 tests

Coverage: ~68% overall
├── Statements: 68%
├── Branches: 35%
├── Functions: 64%
└── Lines: 68%
```

---

## 🏗️ Project Structure
```
wallet-management-api/
├── src/
│   ├── config/          # Configuration files (DB, Redis, Swagger, Logger)
│   ├── controllers/     # Route controllers (Auth, Wallet)
│   ├── dto/             # Data Transfer Objects with validation
│   ├── interfaces/      # TypeScript interfaces
│   ├── middlewares/     # Express middlewares (auth, error, rate-limit)
│   ├── models/          # TypeORM entities (User, Wallet)
│   ├── repositories/    # Database repositories
│   ├── routes/          # API routes (auth, wallet, health)
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions (JWT, Password, Errors, ResponseBuilder)
│   ├── validators/      # Custom validators (blockchain addresses)
│   ├── app.ts           # Express app configuration
│   └── server.ts        # Server entry point
├── tests/
│   ├── unit/            # Unit tests
│   │   ├── config/      # Config tests (Redis, Database)
│   │   ├── services/    # Service tests (AuthService)
│   │   ├── utils/       # Utils tests (JWT, Password)
│   │   └── validators/  # Validator tests (Blockchain)
│   ├── integration/     # Integration tests (Auth, Wallets)
│   └── utils/           # Test utilities and helpers
├── docker-compose.yml   # Docker services (production)
├── docker-compose.test.yml # Test environment
├── Dockerfile           # Multi-stage Docker build
├── .dockerignore        # Docker ignore file
├── jest.config.js       # Jest configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies and scripts
```

---

## 🐳 Docker Commands
```bash
# Start all services (PostgreSQL + Redis + API)
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down

# Rebuild containers
docker-compose up -d --build

# Start test environment
docker-compose -f docker-compose.test.yml up -d

# Clean everything (including volumes)
docker-compose down -v --remove-orphans
```

---

## 🔧 Development Scripts
```bash
# Development
pnpm dev              # Start with nodemon (hot reload)
pnpm build            # Build for production
pnpm start            # Start production build
pnpm start:prod       # Start with NODE_ENV=production

# Database
pnpm migration:generate   # Generate new migration
pnpm migration:run        # Run pending migrations
pnpm migration:revert     # Revert last migration
pnpm migration:show       # Show migration status

# Testing
pnpm test             # Run all tests
pnpm test:unit        # Run unit tests
pnpm test:integration # Run integration tests
pnpm test:watch       # Run tests in watch mode
pnpm test:ci          # Run tests in CI environment

# Code Quality
pnpm lint             # Run ESLint
pnpm format           # Format with Prettier
pnpm type-check       # TypeScript type checking

# Security
pnpm security:audit   # Run security audit
pnpm generate:secrets # Generate JWT secrets
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

- ✅ **Password Hashing**: bcrypt with 10 rounds (configurable)
- ✅ **JWT Tokens**: HS512 algorithm with short expiration (15 min)
- ✅ **Refresh Token Rotation**: One-time use refresh tokens with 7-day expiration
- ✅ **Token Blacklisting**: Redis-based immediate invalidation on logout
- ✅ **Multi-Layer Rate Limiting**: IP, email, and user-based protection
- ✅ **Input Validation**: class-validator for all DTOs
- ✅ **SQL Injection Protection**: TypeORM parameterized queries
- ✅ **CORS**: Configurable origin restrictions
- ✅ **Helmet**: Security headers (CSP, HSTS, etc.)
- ✅ **Environment Variables**: Validated with envalid
- ✅ **Health Monitoring**: Database and Redis connection checks

---

## 📊 Architecture & Design Patterns

- **Clean Architecture**: Separation of concerns with clear boundaries
- **Repository Pattern**: Data access abstraction
- **DTO Pattern**: Request/Response validation and transformation
- **Service Layer Pattern**: Business logic encapsulation
- **Dependency Injection**: Loose coupling between layers
- **Error Handling**: Centralized error middleware with custom error classes
- **Response Builder**: Consistent API response format
- **Logging**: Structured logging with Winston (daily rotation)
- **Testing**: Comprehensive unit and integration test coverage

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

# View PostgreSQL logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

#### 2. Redis Connection Failed
```bash
# Check if Redis is running
docker-compose ps

# Test Redis connection
docker-compose exec redis redis-cli ping

# View Redis logs
docker-compose logs redis

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
# Show migration status
pnpm migration:show

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
pnpm dev
```

#### 6. Tests Failing
```bash
# Ensure test database is running
pnpm test:docker:up

# Run tests
pnpm test

# Clean up
pnpm test:docker:down
```

---

## 🔒 Security Notes

This project uses Docker multi-stage builds with security best practices:
- Non-root user execution
- Minimal production dependencies  
- Regular base image updates
- dumb-init for proper signal handling

**Known Vulnerabilities:** The base Node.js image may report CVEs from automated scanners. These are tracked by the Node.js Security Team and are not exploitable in this application's HTTP API context. For production deployment, consider using Google Distroless images or implement continuous container scanning with Trivy/Snyk.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

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