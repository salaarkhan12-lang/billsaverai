"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../entities/User");
const Session_1 = require("../entities/Session");
const MFASecret_1 = require("../entities/MFASecret");
const database_1 = require("../config/database");
const SRPService_1 = require("./SRPService");
const MFAService_1 = require("./MFAService");
class AuthService {
    userRepository;
    sessionRepository;
    mfaSecretRepository;
    srpService;
    mfaService;
    constructor() {
        this.userRepository = database_1.AppDataSource.getRepository(User_1.User);
        this.sessionRepository = database_1.AppDataSource.getRepository(Session_1.Session);
        this.mfaSecretRepository = database_1.AppDataSource.getRepository(MFASecret_1.MFASecret);
        this.srpService = new SRPService_1.SRPService();
        this.mfaService = new MFAService_1.MFAService();
    }
    // Zero-Knowledge Proof Registration
    async registerWithSRP(data) {
        // Check if user already exists
        const existingUser = await this.userRepository.findOne({ where: { email: data.email } });
        if (existingUser) {
            throw new Error('User already exists');
        }
        // Generate SRP salt and verifier
        const { salt, verifier } = this.srpService.generateSaltAndVerifier(data.password);
        // Hash password for backup (not used in ZKP auth, but for compatibility)
        const passwordHash = await bcryptjs_1.default.hash(data.password, 12);
        // Create user
        const user = this.userRepository.create({
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            passwordHash,
            healthcareRole: data.healthcareRole,
            licenseNumber: data.licenseNumber,
            specialty: data.specialty,
            organization: data.organization,
            status: User_1.UserStatus.PENDING_VERIFICATION,
            profileData: {
                srpSalt: salt,
                srpVerifier: verifier
            }
        });
        await this.userRepository.save(user);
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                healthcareRole: user.healthcareRole
            },
            srpSalt: salt
        };
    }
    // Zero-Knowledge Proof Login
    async loginWithSRP(data) {
        const user = await this.userRepository.findOne({
            where: { email: data.email },
            relations: ['mfaSecrets']
        });
        if (!user || !user.isActive) {
            throw new Error('Invalid credentials');
        }
        // Check if account is locked
        if (user.isLocked) {
            throw new Error('Account is temporarily locked due to failed login attempts');
        }
        // For ZKP, we verify the SRP proof instead of password
        // This is a simplified version - in production, implement full SRP handshake
        const isValidPassword = await bcryptjs_1.default.compare(data.password, user.passwordHash);
        if (!isValidPassword) {
            await this.handleFailedLogin(user);
            throw new Error('Invalid credentials');
        }
        // Check if MFA is required
        const activeMFA = user.mfaSecrets?.find(mfa => mfa.isActive);
        if (activeMFA && !data.mfaCode) {
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName
                },
                tokens: {},
                requiresMFA: true,
                mfaType: activeMFA.type
            };
        }
        // Verify MFA if provided
        if (activeMFA && data.mfaCode) {
            const isMFAValid = await this.mfaService.verifyCode(activeMFA, data.mfaCode);
            if (!isMFAValid) {
                await this.handleFailedLogin(user);
                throw new Error('Invalid MFA code');
            }
        }
        // Reset failed attempts on successful login
        user.failedLoginAttempts = 0;
        user.lastLoginAt = new Date();
        await this.userRepository.save(user);
        // Create session and tokens
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
    // Traditional password-based registration (fallback)
    async register(data) {
        const existingUser = await this.userRepository.findOne({ where: { email: data.email } });
        if (existingUser) {
            throw new Error('User already exists');
        }
        const passwordHash = await bcryptjs_1.default.hash(data.password, 12);
        const user = this.userRepository.create({
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            passwordHash,
            healthcareRole: data.healthcareRole,
            licenseNumber: data.licenseNumber,
            specialty: data.specialty,
            organization: data.organization,
            status: User_1.UserStatus.PENDING_VERIFICATION
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
    async login(data) {
        const user = await this.userRepository.findOne({
            where: { email: data.email },
            relations: ['mfaSecrets']
        });
        if (!user || !user.isActive) {
            throw new Error('Invalid credentials');
        }
        if (user.isLocked) {
            throw new Error('Account is temporarily locked due to failed login attempts');
        }
        const isValidPassword = await bcryptjs_1.default.compare(data.password, user.passwordHash);
        if (!isValidPassword) {
            await this.handleFailedLogin(user);
            throw new Error('Invalid credentials');
        }
        // Check MFA
        const activeMFA = user.mfaSecrets?.find(mfa => mfa.isActive);
        if (activeMFA && !data.mfaCode) {
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName
                },
                tokens: {},
                requiresMFA: true,
                mfaType: activeMFA.type
            };
        }
        if (activeMFA && data.mfaCode) {
            const isMFAValid = await this.mfaService.verifyCode(activeMFA, data.mfaCode);
            if (!isMFAValid) {
                await this.handleFailedLogin(user);
                throw new Error('Invalid MFA code');
            }
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
    async refreshToken(refreshToken) {
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            const session = await this.sessionRepository.findOne({
                where: { id: decoded.sessionId, refreshToken, status: Session_1.SessionStatus.ACTIVE },
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
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
    // Logout - revoke session
    async logout(accessToken) {
        try {
            const decoded = jsonwebtoken_1.default.verify(accessToken, process.env.JWT_SECRET);
            const session = await this.sessionRepository.findOne({
                where: { id: decoded.sessionId }
            });
            if (session) {
                session.status = Session_1.SessionStatus.REVOKED;
                session.revokedAt = new Date();
                session.revokedReason = 'User logout';
                await this.sessionRepository.save(session);
            }
        }
        catch (error) {
            // Token might be invalid, but we don't throw error for logout
        }
    }
    // Verify access token
    async verifyToken(accessToken) {
        try {
            const decoded = jsonwebtoken_1.default.verify(accessToken, process.env.JWT_SECRET);
            const session = await this.sessionRepository.findOne({
                where: { id: decoded.sessionId, status: Session_1.SessionStatus.ACTIVE },
                relations: ['user']
            });
            if (!session || !session.isActive || session.isAccessTokenExpired) {
                throw new Error('Invalid or expired token');
            }
            return { user: session.user, session };
        }
        catch (error) {
            throw new Error('Invalid token');
        }
    }
    async createSession(user, loginData) {
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
    generateTokens(user, session) {
        const accessToken = jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email,
            sessionId: session.id,
            healthcareRole: user.healthcareRole
        }, process.env.JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jsonwebtoken_1.default.sign({
            userId: user.id,
            sessionId: session.id
        }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
        return {
            accessToken,
            refreshToken,
            expiresIn: 15 * 60, // 15 minutes in seconds
            tokenType: 'Bearer'
        };
    }
    async handleFailedLogin(user) {
        user.failedLoginAttempts += 1;
        // Lock account after 5 failed attempts
        if (user.failedLoginAttempts >= 5) {
            user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        }
        await this.userRepository.save(user);
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map