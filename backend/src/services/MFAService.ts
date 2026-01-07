import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import crypto from 'crypto';
import { Repository } from 'typeorm';
import { MFASecret, MFAType, MFAStatus } from '../entities/MFASecret';
import { AppDataSource } from '../config/database';

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

export class MFAService {
  private mfaSecretRepository: Repository<MFASecret>;
  private readonly encryptionKey: Buffer;
  private readonly encryptionIV: Buffer;

  constructor() {
    this.mfaSecretRepository = AppDataSource.getRepository(MFASecret);
    const key = process.env.ENCRYPTION_KEY || 'default-key-32-chars-long';
    const iv = process.env.ENCRYPTION_IV || 'default-iv-16-char';
    this.encryptionKey = Buffer.from(key.padEnd(32, '0').slice(0, 32), 'utf8');
    this.encryptionIV = Buffer.from(iv.padEnd(16, '0').slice(0, 16), 'utf8');
  }

  // Setup TOTP MFA for user
  async setupTOTP(userId: string, issuer: string = 'BillSaver'): Promise<MFASetupResult> {
    // Check if user already has active MFA
    const existingMFA = await this.mfaSecretRepository.findOne({
      where: { userId, status: MFAStatus.ACTIVE }
    });

    if (existingMFA) {
      throw new Error('MFA is already enabled for this user');
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
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
      type: MFAType.TOTP,
      secret: encryptedSecret,
      backupCodes: encryptedBackupCodes,
      status: MFAStatus.ACTIVE
    });

    await this.mfaSecretRepository.save(mfaSecret);

    // Generate QR code
    const qrCode = await qrcode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCode,
      backupCodes
    };
  }

  // Verify TOTP code
  async verifyCode(mfaSecret: MFASecret, code: string): Promise<boolean> {
    try {
      // Decrypt the secret
      const decryptedSecret = this.decrypt(mfaSecret.secret);

      // Verify TOTP code
      const isValid = speakeasy.totp.verify({
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
    } catch (error) {
      return false;
    }
  }

  // Disable MFA for user
  async disableMFA(userId: string): Promise<void> {
    const mfaSecrets = await this.mfaSecretRepository.find({
      where: { userId }
    });

    for (const mfaSecret of mfaSecrets) {
      mfaSecret.status = MFAStatus.REVOKED;
      mfaSecret.updatedAt = new Date();
    }

    await this.mfaSecretRepository.save(mfaSecrets);
  }

  // Get MFA status for user
  async getMFAStatus(userId: string): Promise<{
    enabled: boolean;
    type?: MFAType;
    verified?: boolean;
  }> {
    const mfaSecret = await this.mfaSecretRepository.findOne({
      where: { userId, status: MFAStatus.ACTIVE }
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
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const mfaSecret = await this.mfaSecretRepository.findOne({
      where: { userId, status: MFAStatus.ACTIVE }
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
  async setupSMS(userId: string, phoneNumber: string): Promise<void> {
    // Verify phone number ownership (would integrate with SMS service)
    // For now, just create the record
    const mfaSecret = this.mfaSecretRepository.create({
      userId,
      type: MFAType.SMS,
      secret: '', // Not needed for SMS
      phoneNumber,
      status: MFAStatus.ACTIVE
    });

    await this.mfaSecretRepository.save(mfaSecret);
  }

  // Setup Email MFA (placeholder for future implementation)
  async setupEmail(userId: string, email: string): Promise<void> {
    const mfaSecret = this.mfaSecretRepository.create({
      userId,
      type: MFAType.EMAIL,
      secret: '', // Not needed for email
      email,
      status: MFAStatus.ACTIVE
    });

    await this.mfaSecretRepository.save(mfaSecret);
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  private encrypt(text: string): string {
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, this.encryptionIV);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decrypt(encryptedText: string): string {
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, this.encryptionIV);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
