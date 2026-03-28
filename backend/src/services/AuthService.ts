import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { promisify } from 'util';
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
  private static readonly PBKDF2_ITERATIONS = 500000;
  private static readonly PBKDF2_DIGEST = 'sha512';
  private static readonly PBKDF2_KEYLEN = 64;
  private static readonly PEPPER = process.env.PBKDF2_PEPPER || '';

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.sessionRepository = AppDataSource.getRepository(Session);
    if (!AuthService.PEPPER) {
      throw new Error('PBKDF2_PEPPER is required');
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16);
    const key = await promisify(crypto.pbkdf2)(
      password + AuthService.PEPPER,
      salt,
      AuthService.PBKDF2_ITERATIONS,
      AuthService.PBKDF2_KEYLEN,
      AuthService.PBKDF2_DIGEST
    );
    return `pbkdf2$${AuthService.PBKDF2_DIGEST}$${AuthService.PBKDF2_ITERATIONS}$${salt.toString('base64')}$${key.toString('base64')}`;
  }

  private async verifyPassword(password: string, stored: string): Promise<boolean> {
    if (stored.startsWith('pbkdf2$')) {
      const parts = stored.split('$');
      const iterations = parseInt(parts[2], 10);
      const salt = Buffer.from(parts[3], 'base64');
      const expected = parts[4];
      const derived = await promisify(crypto.pbkdf2)(
        password + AuthService.PEPPER,
        salt,
        iterations,
        AuthService.PBKDF2_KEYLEN,
        AuthService.PBKDF2_DIGEST
      );
      return crypto.timingSafeEqual(Buffer.from(expected, 'base64'), derived);
    }
    return bcrypt.compare(password, stored);
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async register(data: RegisterData): Promise<Partial<User>> {
    const existingUser = await this.userRepository.findOne({ where: { email: data.email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const passwordHash = await this.hashPassword(data.password);

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

    const isValidPassword = await this.verifyPassword(data.password, user.passwordHash);
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

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
      const hashed = this.hashToken(refreshToken);
      const session = await this.sessionRepository.findOne({
        where: { id: decoded.sessionId, refreshToken: hashed, status: SessionStatus.ACTIVE },
        relations: ['user']
      });

      if (!session || !session.isActive) {
        throw new Error('Invalid refresh token');
      }

      const tokens = this.generateTokens(session.user, session);

      session.accessToken = tokens.accessToken;
      session.refreshToken = this.hashToken(tokens.refreshToken);
      session.accessTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      session.refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await this.sessionRepository.save(session);

      return tokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

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
      // ignore invalid token on logout
    }
  }

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
    session.refreshToken = this.hashToken(tokens.refreshToken);
    session.accessTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    session.refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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
      expiresIn: 15 * 60,
      tokenType: 'Bearer'
    };
  }

  private async handleFailedLogin(user: User): Promise<void> {
    user.failedLoginAttempts += 1;

    if (user.failedLoginAttempts >= 5) {
      user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
    }

    await this.userRepository.save(user);
  }
}
