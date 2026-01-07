"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MFAService = void 0;
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
const crypto_1 = __importDefault(require("crypto"));
const MFASecret_1 = require("../entities/MFASecret");
const database_1 = require("../config/database");
class MFAService {
    mfaSecretRepository;
    encryptionKey;
    encryptionIV;
    constructor() {
        this.mfaSecretRepository = database_1.AppDataSource.getRepository(MFASecret_1.MFASecret);
        this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-32-chars-long';
        this.encryptionIV = process.env.ENCRYPTION_IV || 'default-iv-16-char';
    }
    // Setup TOTP MFA for user
    async setupTOTP(userId, issuer = 'BillSaver') {
        // Check if user already has active MFA
        const existingMFA = await this.mfaSecretRepository.findOne({
            where: { userId, status: MFASecret_1.MFAStatus.ACTIVE }
        });
        if (existingMFA) {
            throw new Error('MFA is already enabled for this user');
        }
        // Generate TOTP secret
        const secret = speakeasy_1.default.generateSecret({
            name: `${issuer} (${userId})`,
            issuer,
            length: 32
        });
        // Generate backup codes
        const backupCodes = this.generateBackupCodes();
        // Encrypt the secret and backup codes
        const encryptedSecret = this.encrypt(secret.base32);
        const encryptedBackupCodes = this.encrypt(JSON.stringify(backupCodes));
        // Create MFA secret record
        const mfaSecret = this.mfaSecretRepository.create({
            userId,
            type: MFASecret_1.MFAType.TOTP,
            secret: encryptedSecret,
            backupCodes: encryptedBackupCodes,
            status: MFASecret_1.MFAStatus.ACTIVE
        });
        await this.mfaSecretRepository.save(mfaSecret);
        // Generate QR code
        const qrCode = await qrcode_1.default.toDataURL(secret.otpauth_url);
        return {
            secret: secret.base32,
            qrCode,
            backupCodes
        };
    }
    // Verify TOTP code
    async verifyCode(mfaSecret, code) {
        try {
            // Decrypt the secret
            const decryptedSecret = this.decrypt(mfaSecret.secret);
            // Verify TOTP code
            const isValid = speakeasy_1.default.totp.verify({
                secret: decryptedSecret,
                encoding: 'base32',
                token: code,
                window: 2 // Allow 2 time steps (30 seconds) tolerance
            });
            if (isValid) {
                // Update last used timestamp
                mfaSecret.lastUsedAt = new Date();
                await this.mfaSecretRepository.save(mfaSecret);
                return true;
            }
            // Check if it's a backup code
            if (mfaSecret.backupCodes) {
                const backupCodes = JSON.parse(this.decrypt(mfaSecret.backupCodes));
                const codeIndex = backupCodes.indexOf(code);
                if (codeIndex !== -1) {
                    // Remove used backup code
                    backupCodes.splice(codeIndex, 1);
                    mfaSecret.backupCodes = this.encrypt(JSON.stringify(backupCodes));
                    mfaSecret.lastUsedAt = new Date();
                    await this.mfaSecretRepository.save(mfaSecret);
                    return true;
                }
            }
            // Handle failed attempt
            mfaSecret.failedAttempts += 1;
            if (mfaSecret.failedAttempts >= 5) {
                mfaSecret.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
            }
            await this.mfaSecretRepository.save(mfaSecret);
            return false;
        }
        catch (error) {
            return false;
        }
    }
    // Disable MFA for user
    async disableMFA(userId) {
        const mfaSecrets = await this.mfaSecretRepository.find({
            where: { userId }
        });
        for (const mfaSecret of mfaSecrets) {
            mfaSecret.status = MFASecret_1.MFAStatus.REVOKED;
            mfaSecret.updatedAt = new Date();
        }
        await this.mfaSecretRepository.save(mfaSecrets);
    }
    // Get MFA status for user
    async getMFAStatus(userId) {
        const mfaSecret = await this.mfaSecretRepository.findOne({
            where: { userId, status: MFASecret_1.MFAStatus.ACTIVE }
        });
        if (!mfaSecret) {
            return { enabled: false };
        }
        return {
            enabled: true,
            type: mfaSecret.type,
            verified: mfaSecret.isVerified
        };
    }
    // Regenerate backup codes
    async regenerateBackupCodes(userId) {
        const mfaSecret = await this.mfaSecretRepository.findOne({
            where: { userId, status: MFASecret_1.MFAStatus.ACTIVE }
        });
        if (!mfaSecret) {
            throw new Error('MFA not enabled for this user');
        }
        const backupCodes = this.generateBackupCodes();
        mfaSecret.backupCodes = this.encrypt(JSON.stringify(backupCodes));
        await this.mfaSecretRepository.save(mfaSecret);
        return backupCodes;
    }
    // Setup SMS MFA (placeholder for future implementation)
    async setupSMS(userId, phoneNumber) {
        // Verify phone number ownership (would integrate with SMS service)
        // For now, just create the record
        const mfaSecret = this.mfaSecretRepository.create({
            userId,
            type: MFASecret_1.MFAType.SMS,
            secret: '', // Not needed for SMS
            phoneNumber,
            status: MFASecret_1.MFAStatus.ACTIVE
        });
        await this.mfaSecretRepository.save(mfaSecret);
    }
    // Setup Email MFA (placeholder for future implementation)
    async setupEmail(userId, email) {
        const mfaSecret = this.mfaSecretRepository.create({
            userId,
            type: MFASecret_1.MFAType.EMAIL,
            secret: '', // Not needed for email
            email,
            status: MFASecret_1.MFAStatus.ACTIVE
        });
        await this.mfaSecretRepository.save(mfaSecret);
    }
    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            codes.push(crypto_1.default.randomBytes(4).toString('hex').toUpperCase());
        }
        return codes;
    }
    encrypt(text) {
        const cipher = crypto_1.default.createCipher('aes-256-cbc', this.encryptionKey);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }
    decrypt(encryptedText) {
        const decipher = crypto_1.default.createDecipher('aes-256-cbc', this.encryptionKey);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
exports.MFAService = MFAService;
//# sourceMappingURL=MFAService.js.map