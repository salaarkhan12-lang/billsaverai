"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSession = exports.validateHealthcareRole = exports.requireAdmin = exports.optionalAuth = exports.authorize = exports.authenticate = void 0;
const AuthService_1 = require("../services/AuthService");
const RBACService_1 = require("../services/RBACService");
const Role_1 = require("../entities/Role");
// Authentication middleware
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Access token required' });
            return;
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const authService = new AuthService_1.AuthService();
        const { user, session } = await authService.verifyToken(token);
        req.user = user;
        req.session = session;
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};
exports.authenticate = authenticate;
// Authorization middleware factory
const authorize = (requiredPermissions) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }
            const rbacService = new RBACService_1.RBACService();
            const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
            const hasPermission = await rbacService.hasAnyPermission(req.user.id, permissions);
            if (!hasPermission) {
                res.status(403).json({ error: 'Insufficient permissions' });
                return;
            }
            next();
        }
        catch (error) {
            res.status(500).json({ error: 'Authorization check failed' });
        }
    };
};
exports.authorize = authorize;
// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const authService = new AuthService_1.AuthService();
            const { user, session } = await authService.verifyToken(token);
            req.user = user;
            req.session = session;
        }
        next();
    }
    catch (error) {
        // Ignore auth errors for optional auth
        next();
    }
};
exports.optionalAuth = optionalAuth;
// Admin-only middleware
exports.requireAdmin = (0, exports.authorize)(Role_1.Permission.ADMIN_USERS);
// Healthcare role validation middleware
const validateHealthcareRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        if (!allowedRoles.includes(req.user.healthcareRole)) {
            res.status(403).json({ error: 'Healthcare role not authorized for this action' });
            return;
        }
        next();
    };
};
exports.validateHealthcareRole = validateHealthcareRole;
// Session validation middleware
const validateSession = async (req, res, next) => {
    try {
        if (!req.session) {
            res.status(401).json({ error: 'Valid session required' });
            return;
        }
        // Additional session validation logic can be added here
        // e.g., check IP address consistency, device fingerprinting, etc.
        next();
    }
    catch (error) {
        res.status(500).json({ error: 'Session validation failed' });
    }
};
exports.validateSession = validateSession;
//# sourceMappingURL=auth.js.map