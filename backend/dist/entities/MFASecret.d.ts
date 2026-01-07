import { User } from './User';
export declare enum MFAType {
    TOTP = "totp",// Time-based One-Time Password
    SMS = "sms",
    EMAIL = "email"
}
export declare enum MFAStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    REVOKED = "revoked"
}
export declare class MFASecret {
    id: string;
    userId: string;
    type: MFAType;
    secret: string;
    backupCodes?: string;
    status: MFAStatus;
    verifiedAt?: Date;
    lastUsedAt?: Date;
    failedAttempts: number;
    lockedUntil?: Date;
    phoneNumber?: string;
    email?: string;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    get isActive(): boolean;
    get isLocked(): boolean;
    get isVerified(): boolean;
}
//# sourceMappingURL=MFASecret.d.ts.map