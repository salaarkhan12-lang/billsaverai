import { Session } from './Session';
import { UserRole } from './UserRole';
import { MFASecret } from './MFASecret';
export declare enum UserStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended",
    PENDING_VERIFICATION = "pending_verification"
}
export declare enum HealthcareRole {
    PHYSICIAN = "physician",
    NURSE_PRACTITIONER = "nurse_practitioner",
    PHYSICIAN_ASSISTANT = "physician_assistant",
    REGISTERED_NURSE = "registered_nurse",
    MEDICAL_ASSISTANT = "medical_assistant",
    ADMINISTRATOR = "administrator",
    BILLING_SPECIALIST = "billing_specialist",
    COMPLIANCE_OFFICER = "compliance_officer"
}
export declare class User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
    status: UserStatus;
    healthcareRole: HealthcareRole;
    licenseNumber?: string;
    specialty?: string;
    organization?: string;
    mfaEnabled: boolean;
    emailVerified: boolean;
    emailVerifiedAt?: Date;
    lastLoginAt?: Date;
    failedLoginAttempts: number;
    lockedUntil?: Date;
    profileData?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    sessions: Session[];
    userRoles: UserRole[];
    mfaSecrets: MFASecret[];
    get fullName(): string;
    get isLocked(): boolean;
    get isActive(): boolean;
}
//# sourceMappingURL=User.d.ts.map