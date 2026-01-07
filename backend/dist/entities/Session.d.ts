import { User } from './User';
export declare enum SessionStatus {
    ACTIVE = "active",
    REVOKED = "revoked",
    EXPIRED = "expired"
}
export declare class Session {
    id: string;
    userId: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: Date;
    refreshTokenExpiresAt: Date;
    status: SessionStatus;
    ipAddress?: string;
    userAgent?: string;
    deviceInfo?: Record<string, any>;
    revokedAt?: Date;
    revokedReason?: string;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    get isActive(): boolean;
    get isExpired(): boolean;
    get isAccessTokenExpired(): boolean;
    get isRefreshTokenExpired(): boolean;
}
//# sourceMappingURL=Session.d.ts.map