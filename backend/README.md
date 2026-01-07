# BillSaver Backend API

HIPAA-compliant backend API for BillSaver with zero-knowledge proof authentication, role-based access control, and multi-factor authentication.

## Features

### 🔐 Authentication System
- **Zero-Knowledge Proof Authentication**: SRP (Secure Remote Password) protocol implementation
- **Traditional Password Authentication**: BCrypt hashed passwords as fallback
- **Multi-Factor Authentication**: TOTP, SMS, and Email MFA support
- **Session Management**: Secure JWT tokens with refresh token rotation
- **Account Lockout**: Progressive lockout after failed attempts

### 👥 Role-Based Access Control (RBAC)
- **Healthcare-Specific Roles**: Physician, Nurse Practitioner, Registered Nurse, Medical Assistant, Administrator, etc.
- **Granular Permissions**: 15+ permission types for different operations
- **Dynamic Role Assignment**: Assign/remove roles without code changes
- **Permission Inheritance**: Users inherit permissions from assigned roles

### 🛡️ Security Features
- **Rate Limiting**: Configurable rate limits for auth endpoints
- **Helmet Security Headers**: Comprehensive security headers
- **CORS Protection**: Configurable cross-origin policies
- **Input Validation**: Comprehensive request validation with express-validator
- **Audit Logging**: Winston-based structured logging
- **Data Encryption**: AES-256 encryption for sensitive data

### 🏥 Healthcare Compliance
- **HIPAA-Ready**: Designed for healthcare data protection
- **User Status Management**: Active, Inactive, Suspended, Pending Verification
- **License Tracking**: Healthcare license number and specialty tracking
- **Organization Management**: Multi-tenant organization support

## API Endpoints

### Authentication
```
POST /api/auth/register/srp     - Register with zero-knowledge proof
POST /api/auth/register         - Traditional registration
POST /api/auth/login/srp        - Login with zero-knowledge proof
POST /api/auth/login            - Traditional login
POST /api/auth/refresh          - Refresh access token
POST /api/auth/logout           - Logout and revoke session
```

### Multi-Factor Authentication
```
POST /api/mfa/setup/totp        - Setup TOTP MFA
POST /api/mfa/verify            - Verify MFA setup
POST /api/mfa/disable           - Disable MFA
GET  /api/mfa/status            - Get MFA status
```

### User Profile Management
```
GET  /api/user/profile          - Get current user profile
PUT  /api/user/profile          - Update user profile
```

### Administration (Admin Only)
```
GET  /api/admin/users           - List all users
PUT  /api/admin/users/:id/status - Update user status
POST /api/admin/users/:id/roles  - Assign role to user
GET  /api/admin/users/:id/roles  - Get user roles
```

## Installation

1. **Install Dependencies**
```bash
npm install
```

2. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database Setup**
```bash
npm run migrate
```

4. **Build and Run**
```bash
npm run build
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Main API port | `3000` |
| `HEALTH_PORT` | Health check port | `3001` |
| `DATABASE_URL` | PostgreSQL connection URL | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_REFRESH_SECRET` | Refresh token secret | - |
| `ENCRYPTION_KEY` | AES encryption key (32 chars) | - |
| `ENCRYPTION_IV` | AES initialization vector (16 chars) | - |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3000` |

## Database Schema

### Core Tables
- **users**: User accounts and profiles
- **sessions**: Authentication sessions
- **roles**: RBAC roles and permissions
- **user_roles**: User-role assignments
- **mfa_secrets**: Multi-factor authentication secrets

### Key Relationships
```
users (1) ──── (many) sessions
users (1) ──── (many) user_roles (many) ──── (1) roles
users (1) ──── (many) mfa_secrets
```

## Security Architecture

### Zero-Knowledge Proof (SRP)
- Client and server prove knowledge of password without revealing it
- Resistant to man-in-the-middle attacks
- Forward secrecy properties

### JWT Token Security
- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (7 days)
- Automatic token rotation on refresh
- Session invalidation on logout

### MFA Implementation
- TOTP (RFC 6238) with 30-second windows
- Backup codes for recovery
- Encrypted secret storage
- Failed attempt tracking

## Development

### Project Structure
```
backend/
├── src/
│   ├── config/           # Database and app configuration
│   ├── entities/         # TypeORM entities
│   ├── services/         # Business logic services
│   ├── middleware/       # Express middleware
│   ├── scripts/          # Database migration scripts
│   └── server.ts         # Main application entry point
├── dist/                 # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

### Available Scripts
```bash
npm run dev        # Development with hot reload
npm run build      # Build for production
npm start         # Start production server
npm test          # Run tests
npm run lint      # Lint code
npm run migrate   # Run database migrations
```

## API Documentation

### Authentication Flow

1. **Registration**
```javascript
// Zero-knowledge proof registration
const response = await fetch('/api/auth/register/srp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword',
    firstName: 'John',
    lastName: 'Doe',
    healthcareRole: 'physician',
    licenseNumber: 'MD12345'
  })
});
```

2. **Login**
```javascript
const response = await fetch('/api/auth/login/srp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword'
  })
});

const { tokens, requiresMFA } = await response.json();

if (requiresMFA) {
  // Handle MFA challenge
  const mfaResponse = await fetch('/api/auth/login/srp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user@example.com',
      password: 'securepassword',
      mfaCode: '123456'
    })
  });
}
```

3. **Authenticated Requests**
```javascript
const response = await fetch('/api/user/profile', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

## Healthcare Roles & Permissions

| Role | Permissions |
|------|-------------|
| **physician** | Full analysis, document access, audit logs |
| **nurse_practitioner** | Full analysis, document access, audit logs |
| **registered_nurse** | Read-only document access |
| **medical_assistant** | Read-only document access |
| **billing_specialist** | Analysis, billing rules, audit logs |
| **administrator** | Full user management, system administration |
| **compliance_officer** | Audit logs, compliance monitoring |

## Monitoring & Logging

- **Winston Logger**: Structured JSON logging
- **Health Checks**: `/health` endpoint for load balancer
- **Error Tracking**: Comprehensive error logging
- **Performance Monitoring**: Request timing and metrics

## Deployment

The backend is designed to run in AWS ECS with:
- **Application Load Balancer** for request routing
- **RDS PostgreSQL** for data storage
- **ElastiCache Redis** for session storage (optional)
- **CloudWatch** for monitoring and alerts

## Contributing

1. Follow TypeScript strict mode guidelines
2. Add comprehensive tests for new features
3. Update API documentation
4. Ensure HIPAA compliance for healthcare-related changes
5. Run security audits for authentication changes

## License

This project is part of BillSaver - HIPAA-compliant medical billing analysis tool.
