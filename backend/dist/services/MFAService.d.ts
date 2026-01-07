import { MFASecret, MFAType } from '../entities/MFASecret';
export interface MFAQRCode {
    qrCodeUrl: string;
    secret: string;
    backupCodes: string[];
}
export interface MFASetupResult {
    secret: string;
    qrCode: string;
    backupCodes: string[];
}
export declare class MFAService {
    private mfaSecretRepository;
    private readonly encryptionKey;
    private readonly encryptionIV;
    constructor();
    setupTOTP(userId: string, issuer?: string): Promise<MFASetupResult>;
    verifyCode(mfaSecret: MFASecret, code: string): Promise<boolean>;
    disableMFA(userId: string): Promise<void>;
    getMFAStatus(userId: string): Promise<{
        enabled: boolean;
        type?: MFAType;
        verified?: boolean;
    }>;
    regenerateBackupCodes(userId: string): Promise<string[]>;
    setupSMS(userId: string, phoneNumber: string): Promise<void>;
    setupEmail(userId: string, email: string): Promise<void>;
    private generateBackupCodes;
    private encrypt;
    private decrypt;
}
//# sourceMappingURL=MFAService.d.ts.map