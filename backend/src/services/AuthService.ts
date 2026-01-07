import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Repository } from 'typeorm';
import { User, UserStatus, HealthcareRole } from '../entities/User';
import { Session, SessionStatus } from '../entities/Session';
import { AppDataSource } from '../config/database';

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  healthcareRole: HealthcareRole;
  licenseNumber?: string;
  specialty?: string;
  organization?: string;
}

export interface LoginData {
  email: string;
  password: string;
  deviceInfo?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface AuthResult {
  user: Partial<User>;
  tokens: AuthTokens;
}

export class AuthService {
  private userRepository: Repository<User>;
  private sessionRepository: Repository<Session>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.sessionRepository = AppDataSource.getRepository(Session);
  }

  // Traditional password-based registration (fallback)
  async register(data: RegisterData): Promise<Partial<User>> {
    const existingUser = await this.userRepository.findOne({ where: { email: data.email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = this.userRepository.create({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      passwordHash,
      healthcareRole: data.healthcareRole,
      licenseNumber: data.licenseNumber,
      specialty: data.specialty,
      organization: data.organization,
      status: UserStatus.PENDING_VERIFICATION
    });

    await this.userRepository.save(user);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      healthcareRole: user.healthcareRole
    };
  }

  // Traditional password-based login (fallback)
  async login(data: LoginData): Promise<AuthResult> {
    const user = await this.userRepository.findOne({
      where: { email: data.email }
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    if (user.isLocked) {
      throw new Error('Account is temporarily locked due to failed login attempts');
    }

    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValidPassword) {
      await this.handleFailedLogin(user);
      throw new Error('Invalid credentials');
    }

    user.failedLoginAttempts = 0;
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    const tokens = await this.createSession(user, data);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        healthcareRole: user.healthcareRole,
        lastLoginAt: user.lastLoginAt
      },
      tokens
    };
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
      const session = await this.sessionRepository.findOne({
        where: { id: decoded.sessionId, refreshToken, status: SessionStatus.ACTIVE },
        relations: ['user']
      });

      if (!session || !session.isActive) {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = this.generateTokens(session.user, session);

      // Update session with new tokens
      session.accessToken = tokens.accessToken;
      session.refreshToken = tokens.refreshToken;
      session.accessTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      session.refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await this.sessionRepository.save(session);

      return tokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Logout - revoke session
  async logout(accessToken: string): Promise<void> {
    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as any;
      const session = await this.sessionRepository.findOne({
        where: { id: decoded.sessionId }
      });

      if (session) {
        session.status = SessionStatus.REVOKED;
        session.revokedAt = new Date();
        session.revokedReason = 'User logout';
        await this.sessionRepository.save(session);
      }
    } catch (error) {
      // Token might be invalid, but we don't throw error for logout
    }
  }

  // Verify access token
  async verifyToken(accessToken: string): Promise<{ user: User; session: Session }> {
    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as any;
      const session = await this.sessionRepository.findOne({
        where: { id: decoded.sessionId, status: SessionStatus.ACTIVE },
        relations: ['user']
      });

      if (!session || !session.isActive || session.isAccessTokenExpired) {
        throw new Error('Invalid or expired token');
      }

      return { user: session.user, session };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  private async createSession(user: User, loginData: LoginData): Promise<AuthTokens> {
    const session = this.sessionRepository.create({
      userId: user.id,
      ipAddress: loginData.ipAddress,
      userAgent: loginData.userAgent,
      deviceInfo: loginData.deviceInfo
    });

    const tokens = this.generateTokens(user, session);
    session.accessToken = tokens.accessToken;
    session.refreshToken = tokens.refreshToken;
    session.accessTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    session.refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.sessionRepository.save(session);

    return tokens;
  }

  private generateTokens(user: User, session: Session): AuthTokens {
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        sessionId: session.id,
        healthcareRole: user.healthcareRole
      },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        sessionId: session.id
      },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
      tokenType: 'Bearer'
    };
  }

  private async handleFailedLogin(user: User): Promise<void> {
    user.failedLoginAttempts += 1;

    // Lock account after 5 failed attempts
    if (user.failedLoginAttempts >= 5) {
      user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }

    await this.userRepository.save(user);
  }
}
