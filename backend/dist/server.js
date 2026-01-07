"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_winston_1 = __importDefault(require("express-winston"));
const winston_1 = __importDefault(require("winston"));
const express_validator_1 = require("express-validator");
const database_1 = require("./config/database");
const AuthService_1 = require("./services/AuthService");
const MFAService_1 = require("./services/MFAService");
const RBACService_1 = require("./services/RBACService");
const auth_1 = require("./middleware/auth");
const Role_1 = require("./entities/Role");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const HEALTH_PORT = process.env.HEALTH_PORT || 3001;
// Logger configuration
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    defaultMeta: { service: 'billsaver-backend' },
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
        })
    ]
});
// Middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use((0, compression_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);
// Auth-specific rate limiting
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth attempts per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
// Request logging
app.use(express_winston_1.default.logger({
    winstonInstance: logger,
    meta: true,
    msg: 'HTTP {{req.method}} {{req.url}}',
    expressFormat: true,
    colorize: false,
    ignoreRoute: (req, res) => false
}));
// Initialize services
const authService = new AuthService_1.AuthService();
const mfaService = new MFAService_1.MFAService();
const rbacService = new RBACService_1.RBACService();
// Health check endpoint (separate port for load balancer)
const healthApp = (0, express_1.default)();
healthApp.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '2.0.0'
    });
});
// Authentication Routes
// Register with zero-knowledge proof
app.post('/api/auth/register/srp', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 8 }),
    (0, express_validator_1.body)('firstName').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('lastName').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('healthcareRole').isIn(Object.values(require('./entities/User').HealthcareRole)),
    (0, express_validator_1.body)('licenseNumber').optional().trim(),
    (0, express_validator_1.body)('specialty').optional().trim(),
    (0, express_validator_1.body)('organization').optional().trim(),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const result = await authService.registerWithSRP(req.body);
        res.status(201).json(result);
    }
    catch (error) {
        logger.error('SRP Registration error:', error);
        res.status(400).json({ error: error.message });
    }
});
// Traditional registration
app.post('/api/auth/register', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 8 }),
    (0, express_validator_1.body)('firstName').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('lastName').trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('healthcareRole').isIn(Object.values(require('./entities/User').HealthcareRole)),
    (0, express_validator_1.body)('licenseNumber').optional().trim(),
    (0, express_validator_1.body)('specialty').optional().trim(),
    (0, express_validator_1.body)('organization').optional().trim(),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const result = await authService.register(req.body);
        res.status(201).json(result);
    }
    catch (error) {
        logger.error('Registration error:', error);
        res.status(400).json({ error: error.message });
    }
});
// Login with SRP
app.post('/api/auth/login/srp', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 1 }),
    (0, express_validator_1.body)('mfaCode').optional().isLength({ min: 6, max: 8 }),
], authLimiter, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const result = await authService.loginWithSRP({
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
    }
    catch (error) {
        logger.error('SRP Login error:', error);
        res.status(401).json({ error: error.message });
    }
});
// Traditional login
app.post('/api/auth/login', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 1 }),
    (0, express_validator_1.body)('mfaCode').optional().isLength({ min: 6, max: 8 }),
], authLimiter, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
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
    }
    catch (error) {
        logger.error('Login error:', error);
        res.status(401).json({ error: error.message });
    }
});
// Refresh token
app.post('/api/auth/refresh', [
    (0, express_validator_1.body)('refreshToken').isLength({ min: 1 }),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const tokens = await authService.refreshToken(req.body.refreshToken);
        res.json(tokens);
    }
    catch (error) {
        logger.error('Token refresh error:', error);
        res.status(401).json({ error: error.message });
    }
});
// Logout
app.post('/api/auth/logout', auth_1.authenticate, async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            await authService.logout(token);
        }
        res.json({ message: 'Logged out successfully' });
    }
    catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({ error: error.message });
    }
});
// MFA Routes
// Setup TOTP MFA
app.post('/api/mfa/setup/totp', auth_1.authenticate, async (req, res) => {
    try {
        const result = await mfaService.setupTOTP(req.user.id);
        res.json(result);
    }
    catch (error) {
        logger.error('MFA setup error:', error);
        res.status(400).json({ error: error.message });
    }
});
// Verify MFA setup
app.post('/api/mfa/verify', [
    (0, express_validator_1.body)('code').isLength({ min: 6, max: 8 }),
], auth_1.authenticate, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const mfaSecret = await database_1.AppDataSource.getRepository(require('./entities/MFASecret').MFASecret).findOne({
            where: { userId: req.user.id, status: require('./entities/MFASecret').MFAStatus.ACTIVE }
        });
        if (!mfaSecret) {
            return res.status(400).json({ error: 'MFA not set up' });
        }
        const isValid = await mfaService.verifyCode(mfaSecret, req.body.code);
        if (isValid) {
            mfaSecret.verifiedAt = new Date();
            await database_1.AppDataSource.getRepository(require('./entities/MFASecret').MFASecret).save(mfaSecret);
            res.json({ message: 'MFA verified successfully' });
        }
        else {
            res.status(400).json({ error: 'Invalid MFA code' });
        }
    }
    catch (error) {
        logger.error('MFA verification error:', error);
        res.status(500).json({ error: error.message });
    }
});
// Disable MFA
app.post('/api/mfa/disable', auth_1.authenticate, async (req, res) => {
    try {
        await mfaService.disableMFA(req.user.id);
        res.json({ message: 'MFA disabled successfully' });
    }
    catch (error) {
        logger.error('MFA disable error:', error);
        res.status(500).json({ error: error.message });
    }
});
// Get MFA status
app.get('/api/mfa/status', auth_1.authenticate, async (req, res) => {
    try {
        const status = await mfaService.getMFAStatus(req.user.id);
        res.json(status);
    }
    catch (error) {
        logger.error('MFA status error:', error);
        res.status(500).json({ error: error.message });
    }
});
// User Profile Routes
// Get current user profile
app.get('/api/user/profile', auth_1.authenticate, async (req, res) => {
    try {
        const user = await database_1.AppDataSource.getRepository(require('./entities/User').User).findOne({
            where: { id: req.user.id },
            select: ['id', 'email', 'firstName', 'lastName', 'healthcareRole', 'licenseNumber', 'specialty', 'organization', 'mfaEnabled', 'emailVerified', 'lastLoginAt', 'createdAt']
        });
        res.json(user);
    }
    catch (error) {
        logger.error('Get profile error:', error);
        res.status(500).json({ error: error.message });
    }
});
// Update user profile
app.put('/api/user/profile', [
    (0, express_validator_1.body)('firstName').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('lastName').optional().trim().isLength({ min: 1 }),
    (0, express_validator_1.body)('licenseNumber').optional().trim(),
    (0, express_validator_1.body)('specialty').optional().trim(),
    (0, express_validator_1.body)('organization').optional().trim(),
], auth_1.authenticate, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const user = await database_1.AppDataSource.getRepository(require('./entities/User').User).findOne({
            where: { id: req.user.id }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Update allowed fields
        const allowedFields = ['firstName', 'lastName', 'licenseNumber', 'specialty', 'organization'];
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                user[field] = req.body[field];
            }
        });
        await database_1.AppDataSource.getRepository(require('./entities/User').User).save(user);
        res.json({ message: 'Profile updated successfully' });
    }
    catch (error) {
        logger.error('Update profile error:', error);
        res.status(500).json({ error: error.message });
    }
});
// Admin Routes
// Get all users (admin only)
app.get('/api/admin/users', auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const users = await database_1.AppDataSource.getRepository(require('./entities/User').User).find({
            select: ['id', 'email', 'firstName', 'lastName', 'healthcareRole', 'status', 'mfaEnabled', 'emailVerified', 'lastLoginAt', 'createdAt'],
            order: { createdAt: 'DESC' }
        });
        res.json(users);
    }
    catch (error) {
        logger.error('Get users error:', error);
        res.status(500).json({ error: error.message });
    }
});
// Update user status (admin only)
app.put('/api/admin/users/:userId/status', [
    (0, express_validator_1.body)('status').isIn(Object.values(require('./entities/User').UserStatus)),
], auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const user = await database_1.AppDataSource.getRepository(require('./entities/User').User).findOne({
            where: { id: req.params.userId }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.status = req.body.status;
        await database_1.AppDataSource.getRepository(require('./entities/User').User).save(user);
        res.json({ message: 'User status updated successfully' });
    }
    catch (error) {
        logger.error('Update user status error:', error);
        res.status(500).json({ error: error.message });
    }
});
// Assign role to user (admin only)
app.post('/api/admin/users/:userId/roles', [
    (0, express_validator_1.body)('roleName').isLength({ min: 1 }),
], auth_1.authenticate, auth_1.requireAdmin, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        await rbacService.assignRole(req.params.userId, req.body.roleName, req.user.id);
        res.json({ message: 'Role assigned successfully' });
    }
    catch (error) {
        logger.error('Assign role error:', error);
        res.status(400).json({ error: error.message });
    }
});
// Get user roles
app.get('/api/admin/users/:userId/roles', auth_1.authenticate, (0, auth_1.authorize)(Role_1.Permission.USER_READ), async (req, res) => {
    try {
        const roles = await rbacService.getUserRoles(req.params.userId);
        res.json(roles);
    }
    catch (error) {
        logger.error('Get user roles error:', error);
        res.status(500).json({ error: error.message });
    }
});
// Error handling middleware
app.use((error, req, res, next) => {
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
        await database_1.AppDataSource.initialize();
        logger.info('Database connection established');
        // Initialize default roles
        await rbacService.initializeDefaultRoles();
        logger.info('Default roles initialized');
        // Start main server
        app.listen(PORT, () => {
            logger.info(`Main server listening on port ${PORT}`);
        });
        // Start health check server
        healthApp.listen(HEALTH_PORT, () => {
            logger.info(`Health check server listening on port ${HEALTH_PORT}`);
        });
    }
    catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await database_1.AppDataSource.destroy();
    process.exit(0);
});
process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await database_1.AppDataSource.destroy();
    process.exit(0);
});
startServer();
//# sourceMappingURL=server.js.map