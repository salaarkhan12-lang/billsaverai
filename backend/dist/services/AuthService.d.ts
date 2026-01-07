import { User, HealthcareRole } from '../entities/User';
import { Session } from '../entities/Session';
import { MFAType } from '../entities/MFASecret';
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
    mfaCode?: string;
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
    requiresMFA?: boolean;
    mfaType?: MFAType;
}
export declare class AuthService {
    private userRepository;
    private sessionRepository;
    private mfaSecretRepository;
    private srpService;
    private mfaService;
    constructor();
    registerWithSRP(data: RegisterData): Promise<{
        user: Partial<User>;
        srpSalt: string;
    }>;
    loginWithSRP(data: LoginData): Promise<AuthResult>;
    register(data: RegisterData): Promise<Partial<User>>;
    login(data: LoginData): Promise<AuthResult>;
    refreshToken(refreshToken: string): Promise<AuthTokens>;
    logout(accessToken: string): Promise<void>;
    verifyToken(accessToken: string): Promise<{
        user: User;
        session: Session;
    }>;
    private createSession;
    private generateTokens;
    private handleFailedLogin;
}
//# sourceMappingURL=AuthService.d.ts.map