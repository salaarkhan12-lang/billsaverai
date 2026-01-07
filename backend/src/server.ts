import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import expressWinston from 'express-winston';
import winston from 'winston';
import { body, validationResult } from 'express-validator';
import { AppDataSource } from './config/database';
import { AuthService } from './services/AuthService';
import { MFAService } from './services/MFAService';
import { RBACService } from './services/RBACService';
import { authenticate, authorize, optionalAuth, requireAdmin, validateHealthcareRole, AuthenticatedRequest } from './middleware/auth';
import { Permission } from './entities/Role';
import { MFASecret, MFAStatus } from './entities/MFASecret';
import { User, UserStatus, HealthcareRole } from './entities/User';

const app = express();
const PORT = process.env.PORT || 3001;
const HEALTH_PORT = process.env.HEALTH_PORT || 3001;

// Logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'billsaver-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Auth-specific rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Request logging
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorize: false,
  ignoreRoute: (req, res) => false
}));

// Initialize services
const authService = new AuthService();
const mfaService = new MFAService();
const rbacService = new RBACService();

// Health check endpoint (separate port for load balancer)
const healthApp = express();
healthApp.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '2.0.0'
  });
});

// Authentication Routes



// Traditional registration
app.post('/api/auth/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('firstName').trim().isLength({ min: 1 }),
  body('lastName').trim().isLength({ min: 1 }),
  body('healthcareRole').isIn(Object.values(require('./entities/User').HealthcareRole)),
  body('licenseNumber').optional().trim(),
  body('specialty').optional().trim(),
  body('organization').optional().trim(),
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    logger.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});



// Traditional login
app.post('/api/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 }),
  body('mfaCode').optional().isLength({ min: 6, max: 8 }),
], authLimiter, async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const result = await authService.login({
      ...req.body,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceInfo: {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        acceptLanguage: req.get('Accept-Language')
      }
    });

    res.json(result);
  } catch (error: any) {
    logger.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

// Refresh token
app.post('/api/auth/refresh', [
  body('refreshToken').isLength({ min: 1 }),
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tokens = await authService.refreshToken(req.body.refreshToken);
    res.json(tokens);
  } catch (error: any) {
    logger.error('Token refresh error:', error);
    res.status(401).json({ error: error.message });
  }
});

// Logout
app.post('/api/auth/logout', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await authService.logout(token);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// MFA Routes

// Setup TOTP MFA
app.post('/api/mfa/setup/totp', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await mfaService.setupTOTP(req.user.id);
    res.json(result);
  } catch (error: any) {
    logger.error('MFA setup error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Verify MFA setup
app.post('/api/mfa/verify', [
  body('code').isLength({ min: 6, max: 8 }),
], authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const mfaSecret = await AppDataSource.getRepository(MFASecret).findOne({
      where: { userId: req.user.id, status: MFAStatus.ACTIVE }
    });

    if (!mfaSecret) {
      return res.status(400).json({ error: 'MFA not set up' });
    }

    const isValid = await mfaService.verifyCode(mfaSecret, req.body.code);
    if (isValid) {
      mfaSecret.verifiedAt = new Date();
      await AppDataSource.getRepository(MFASecret).save(mfaSecret);
      res.json({ message: 'MFA verified successfully' });
    } else {
      res.status(400).json({ error: 'Invalid MFA code' });
    }
  } catch (error: any) {
    logger.error('MFA verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Disable MFA
app.post('/api/mfa/disable', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    await mfaService.disableMFA(req.user.id);
    res.json({ message: 'MFA disabled successfully' });
  } catch (error: any) {
    logger.error('MFA disable error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get MFA status
app.get('/api/mfa/status', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const status = await mfaService.getMFAStatus(req.user.id);
    res.json(status);
  } catch (error: any) {
    logger.error('MFA status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// User Profile Routes

// Get current user profile
app.get('/api/user/profile', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: req.user.id },
      select: ['id', 'email', 'firstName', 'lastName', 'healthcareRole', 'licenseNumber', 'specialty', 'organization', 'mfaEnabled', 'emailVerified', 'lastLoginAt', 'createdAt']
    });
    res.json(user);
  } catch (error: any) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
app.put('/api/user/profile', [
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
  body('licenseNumber').optional().trim(),
  body('specialty').optional().trim(),
  body('organization').optional().trim(),
], authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update allowed fields
    const allowedFields = ['firstName', 'lastName', 'licenseNumber', 'specialty', 'organization'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        (user as any)[field] = req.body[field];
      }
    });

    await AppDataSource.getRepository(User).save(user);
    res.json({ message: 'Profile updated successfully' });
  } catch (error: any) {
    logger.error('Update profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin Routes

// Get all users (admin only)
app.get('/api/admin/users', authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const users = await AppDataSource.getRepository(User).find({
      select: ['id', 'email', 'firstName', 'lastName', 'healthcareRole', 'status', 'mfaEnabled', 'emailVerified', 'lastLoginAt', 'createdAt'],
      order: { createdAt: 'DESC' }
    });
    res.json(users);
  } catch (error: any) {
    logger.error('Get users error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user status (admin only)
app.put('/api/admin/users/:userId/status', [
  body('status').isIn(Object.values(UserStatus)),
], authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: req.params.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.status = req.body.status;
    await AppDataSource.getRepository(User).save(user);
    res.json({ message: 'User status updated successfully' });
  } catch (error: any) {
    logger.error('Update user status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Assign role to user (admin only)
app.post('/api/admin/users/:userId/roles', [
  body('roleName').isLength({ min: 1 }),
], authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    await rbacService.assignRole(req.params.userId, req.body.roleName, req.user.id);
    res.json({ message: 'Role assigned successfully' });
  } catch (error: any) {
    logger.error('Assign role error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get user roles
app.get('/api/admin/users/:userId/roles', authenticate, authorize(Permission.USER_READ), async (req: AuthenticatedRequest, res) => {
  try {
    const roles = await rbacService.getUserRoles(req.params.userId);
    res.json(roles);
  } catch (error: any) {
    logger.error('Get user roles error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    logger.info('Database connection established');

    // Initialize default roles
    await rbacService.initializeDefaultRoles();
    logger.info('Default roles initialized');

    // Initialize analysis result service
    const { AnalysisResultService } = await import('./services/AnalysisResultService');
    const analysisResultService = new AnalysisResultService();

    // Analysis Results Routes

    // Get all analysis results for user
    app.get('/api/analysis-results', authenticate, async (req: AuthenticatedRequest, res) => {
      try {
        const results = await analysisResultService.getUserAnalysisResults(req.user.id);
        res.json(results);
      } catch (error: any) {
        logger.error('Get analysis results error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Create new analysis result
    app.post('/api/analysis-results', authenticate, async (req: AuthenticatedRequest, res) => {
      try {
        const result = await analysisResultService.createAnalysisResult(req.user.id, req.body);
        res.status(201).json(result);
      } catch (error: any) {
        logger.error('Create analysis result error:', error);
        res.status(400).json({ error: error.message });
      }
    });

    // Delete analysis result
    app.delete('/api/analysis-results/:id', authenticate, async (req: AuthenticatedRequest, res) => {
      try {
        const success = await analysisResultService.deleteAnalysisResult(req.user.id, req.params.id);
        if (success) {
          res.json({ message: 'Analysis result deleted successfully' });
        } else {
          res.status(404).json({ error: 'Analysis result not found' });
        }
      } catch (error: any) {
        logger.error('Delete analysis result error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Export analysis results
    app.get('/api/export/analysis-results', authenticate, async (req: AuthenticatedRequest, res) => {
      try {
        const format = (req.query.format as string) || 'json';
        const data = await analysisResultService.exportAnalysisResults(req.user.id, format);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="analysis-results.${format}"`);
        res.send(data);
      } catch (error: any) {
        logger.error('Export analysis results error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Import analysis results
    app.post('/api/import/analysis-results', authenticate, async (req: AuthenticatedRequest, res) => {
      try {
        const { data } = req.body;
        if (!data) {
          return res.status(400).json({ error: 'Data is required' });
        }
        const count = await analysisResultService.importAnalysisResults(req.user.id, data);
        res.json({ message: `Imported ${count} analysis results` });
      } catch (error: any) {
        logger.error('Import analysis results error:', error);
        res.status(400).json({ error: error.message });
      }
    });

    // Start main server
    app.listen(PORT, () => {
      logger.info(`Main server listening on port ${PORT}`);
    });

    // Start health check server
    healthApp.listen(HEALTH_PORT, () => {
      logger.info(`Health check server listening on port ${HEALTH_PORT}`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await AppDataSource.destroy();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await AppDataSource.destroy();
  process.exit(0);
});

startServer();

// Backup & Export Routes

// Create database backup (admin only)
app.post("/api/admin/backup", authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { BackupService } = await import("./services/BackupService");
    const backupService = new BackupService();
    const options = {
      includeFiles: req.body.includeFiles || false,
      encrypt: req.body.encrypt || false,
      password: req.body.password
    };

    const result = await backupService.createEncryptedBackup(options);
    res.json({
      message: "Backup created successfully",
      backupPath: result.backupPath,
      metadata: result.metadata,
      size: result.size
    });
  } catch (error: any) {
    logger.error("Backup creation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// List backups (admin only)
app.get("/api/admin/backups", authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { BackupService } = await import("./services/BackupService");
    const backupService = new BackupService();
    const backups = await backupService.listBackups();
    res.json(backups);
  } catch (error: any) {
    logger.error("List backups error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Restore from backup (admin only)
app.post("/api/admin/restore", authenticate, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { backupPath, password, dryRun } = req.body;

    if (!backupPath) {
      return res.status(400).json({ error: "Backup path is required" });
    }

    const { BackupService } = await import("./services/BackupService");
    const backupService = new BackupService();
    const result = await backupService.restoreFromBackup(backupPath, password, { dryRun });
    res.json(result);
  } catch (error: any) {
    logger.error("Restore error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Export user data
app.post("/api/user/export", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { BackupService } = await import("./services/BackupService");
    const backupService = new BackupService();
    const options = {
      format: req.body.format || "json",
      includeAnalysisResults: req.body.includeAnalysisResults || false,
      password: req.body.password
    };

    const result = await backupService.exportUserData(req.user.id, options);

    res.setHeader("Content-Type", result.format);
    res.setHeader("Content-Disposition", `attachment; filename="export.${options.format}"`);
    res.send(result.data);
  } catch (error: any) {
    logger.error("Export error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Import user data
app.post("/api/user/import", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { data, format, password } = req.body;

    if (!data) {
      return res.status(400).json({ error: "Data is required" });
    }

    const { BackupService } = await import("./services/BackupService");
    const backupService = new BackupService();
    const result = await backupService.importUserData(req.user.id, data, format, password);
    res.json(result);
  } catch (error: any) {
    logger.error("Import error:", error);
    res.status(500).json({ error: error.message });
  }
});

