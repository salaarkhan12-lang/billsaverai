import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { RBACService } from '../services/RBACService';
import { Permission } from '../entities/Role';

export interface AuthenticatedRequest extends Request {
  user?: any;
  session?: any;
}

// Authentication middleware
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const authService = new AuthService();
    const { user, session } = await authService.verifyToken(token);

    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Authorization middleware factory
export const authorize = (requiredPermissions: Permission | Permission[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const rbacService = new RBACService();
      const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

      const hasPermission = await rbacService.hasAnyPermission(req.user.id, permissions);

      if (!hasPermission) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const authService = new AuthService();
      const { user, session } = await authService.verifyToken(token);
      req.user = user;
      req.session = session;
    }
    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};

// Admin-only middleware
export const requireAdmin = authorize(Permission.ADMIN_USERS);

// Healthcare role validation middleware
export const validateHealthcareRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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

// Session validation middleware
export const validateSession = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.session) {
      res.status(401).json({ error: 'Valid session required' });
      return;
    }

    // Additional session validation logic can be added here
    // e.g., check IP address consistency, device fingerprinting, etc.

    next();
  } catch (error) {
    res.status(500).json({ error: 'Session validation failed' });
  }
};
