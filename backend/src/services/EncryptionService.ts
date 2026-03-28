import { AppDataSource } from '../config/database';
import { AnalysisResult as AnalysisResultEntity, AnalysisStatus } from '../entities/AnalysisResult';
import { User } from '../entities/User';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: 'encrypt' | 'decrypt' | 'access' | 'modify' | 'delete';
  resourceType: 'analysis_result' | 'document';
  resourceId: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export class EncryptionService {
  private auditLogs: AuditLogEntry[] = [];
  private static readonly PBKDF2_ITERATIONS = 500000;
  private static readonly PBKDF2_DIGEST = 'sha512';

  constructor() {
    if (!process.env.FILE_KEY_SECRET || !process.env.PBKDF2_PEPPER) {
      throw new Error('FILE_KEY_SECRET and PBKDF2_PEPPER are required');
    }
    if (!process.env.AUDIT_LOG_KEY) {
      throw new Error('AUDIT_LOG_KEY is required for audit logging');
    }
  }

  async encryptBuffer(plaintext: Buffer): Promise<{ ciphertext: Buffer; iv: string; salt: string; authTag: string }> {
    const salt = crypto.randomBytes(16);
    const key = await new Promise<Buffer>((resolve, reject) =>
      crypto.pbkdf2(process.env.FILE_KEY_SECRET! + process.env.PBKDF2_PEPPER!, salt, EncryptionService.PBKDF2_ITERATIONS, 32, EncryptionService.PBKDF2_DIGEST, (err, derived) => {
        if (err) reject(err);
        else resolve(derived);
      })
    );
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return { ciphertext, iv: iv.toString('base64'), salt: salt.toString('base64'), authTag: authTag.toString('base64') };
  }

  async decryptBuffer(ciphertext: Buffer, saltB64: string, ivB64: string, authTagB64: string): Promise<Buffer> {
    const salt = Buffer.from(saltB64, 'base64');
    const key = await new Promise<Buffer>((resolve, reject) =>
      crypto.pbkdf2(process.env.FILE_KEY_SECRET! + process.env.PBKDF2_PEPPER!, salt, EncryptionService.PBKDF2_ITERATIONS, 32, EncryptionService.PBKDF2_DIGEST, (err, derived) => {
        if (err) reject(err);
        else resolve(derived);
      })
    );
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }

  async validateEncryptedData(
    userId: string,
    encryptedData: {
      encryptedResult: string;
      dataHash: string;
      encryptionIv: string;
      encryptionKeySalt: string;
      encryptionAuthTag?: string;
    }
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      if (!encryptedData.encryptedResult) errors.push('Encrypted result is missing');
      if (!encryptedData.dataHash) errors.push('Data hash is missing');
      if (!encryptedData.encryptionIv) errors.push('Encryption IV is missing');
      if (!encryptedData.encryptionKeySalt) errors.push('Encryption key salt is missing');

      const base64Fields = [
        'encryptedResult',
        'dataHash',
        'encryptionIv',
        'encryptionKeySalt',
        'encryptionAuthTag'
      ];
      for (const field of base64Fields) {
        if ((encryptedData as any)[field]) {
          try {
            Buffer.from((encryptedData as any)[field], 'base64');
          } catch {
            errors.push(`${field} is not valid base64`);
          }
        }
      }

      if (encryptedData.dataHash && !/^[a-f0-9]{64}$/i.test(encryptedData.dataHash)) {
        errors.push('Data hash is not a valid SHA-256 hash');
      }

      if (encryptedData.encryptionKeySalt) {
        const salt = Buffer.from(encryptedData.encryptionKeySalt, 'base64');
        if (salt.length < 16) warnings.push('Encryption salt is shorter than recommended (16 bytes)');
      }

      await this.logAuditEvent({
        userId,
        action: 'access',
        resourceType: 'analysis_result',
        resourceId: 'validation',
        success: errors.length === 0,
        errorMessage: errors.length > 0 ? errors.join(', ') : undefined,
        metadata: { validationWarnings: warnings.length }
      });

    } catch (error) {
      errors.push(`Validation failed: ${(error as Error).message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async storeEncryptedAnalysisResult(
    userId: string,
    documentId: string | undefined,
    encryptedData: {
      encryptedResult: string;
      dataHash: string;
      encryptionIv: string;
      encryptionKeySalt: string;
      encryptionAuthTag?: string;
    },
    metadata?: {
      overallScore?: number;
      documentationLevel?: string;
      totalPotentialRevenueLoss?: string;
      suggestedEMLevel?: string;
      isMigrated?: boolean;
      migrationSource?: string;
    }
  ): Promise<AnalysisResultEntity> {
    try {
      const validation = await this.validateEncryptedData(userId, encryptedData);
      if (!validation.isValid) {
        throw new Error(`Invalid encrypted data: ${validation.errors.join(', ')}`);
      }

      const analysisResultRepo = AppDataSource.getRepository(AnalysisResultEntity);
      const analysisResult = analysisResultRepo.create({
        userId,
        documentId,
        encryptedData: encryptedData.encryptedResult,
        dataHash: encryptedData.dataHash,
        encryptionKeySalt: encryptedData.encryptionKeySalt,
        encryptionIv: encryptedData.encryptionIv,
        encryptionAuthTag: encryptedData.encryptionAuthTag,
        status: AnalysisStatus.COMPLETED,
        metadataSafe: metadata ? { ...metadata } : undefined,
        isMigrated: metadata?.isMigrated || false,
        migrationSource: metadata?.migrationSource,
      });

      const saved = await analysisResultRepo.save(analysisResult);

      await this.logAuditEvent({
        userId,
        action: 'encrypt',
        resourceType: 'analysis_result',
        resourceId: saved.id,
        success: true,
        metadata: {
          documentId,
          hasDocument: !!documentId,
          isMigrated: metadata?.isMigrated
        }
      });

      return saved;
    } catch (error) {
      await this.logAuditEvent({
        userId,
        action: 'encrypt',
        resourceType: 'analysis_result',
        resourceId: 'unknown',
        success: false,
        errorMessage: (error as Error).message
      });

      throw error;
    }
  }

  async retrieveEncryptedAnalysisResult(
    userId: string,
    analysisResultId: string
  ): Promise<AnalysisResultEntity | null> {
    try {
      const analysisResultRepo = AppDataSource.getRepository(AnalysisResultEntity);
      const analysisResult = await analysisResultRepo.findOne({
        where: { id: analysisResultId, userId },
        relations: ['user', 'document']
      });

      if (analysisResult) {
        await this.logAuditEvent({
          userId,
          action: 'access',
          resourceType: 'analysis_result',
          resourceId: analysisResultId,
          success: true
        });
      }

      return analysisResult;
    } catch (error) {
      await this.logAuditEvent({
        userId,
        action: 'access',
        resourceType: 'analysis_result',
        resourceId: analysisResultId,
        success: false,
        errorMessage: (error as Error).message
      });

      throw error;
    }
  }

  async listUserAnalysisResults(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      includeMigrated?: boolean;
      documentId?: string;
    } = {}
  ): Promise<AnalysisResultEntity[]> {
    try {
      const analysisResultRepo = AppDataSource.getRepository(AnalysisResultEntity);
      const queryBuilder = analysisResultRepo.createQueryBuilder('ar')
        .where('ar.userId = :userId', { userId })
        .andWhere('ar.status = :status', { status: AnalysisStatus.COMPLETED })
        .orderBy('ar.createdAt', 'DESC');

      if (options.documentId) {
        queryBuilder.andWhere('ar.documentId = :documentId', { documentId: options.documentId });
      }

      if (!options.includeMigrated) {
        queryBuilder.andWhere('ar.isMigrated = false');
      }

      if (options.limit) queryBuilder.limit(options.limit);
      if (options.offset) queryBuilder.offset(options.offset);

      const results = await queryBuilder.getMany();

      await this.logAuditEvent({
        userId,
        action: 'access',
        resourceType: 'analysis_result',
        resourceId: 'list',
        success: true,
        metadata: {
          count: results.length,
          limit: options.limit,
          offset: options.offset
        }
      });

      return results;
    } catch (error) {
      await this.logAuditEvent({
        userId,
        action: 'access',
        resourceType: 'analysis_result',
        resourceId: 'list',
        success: false,
        errorMessage: (error as Error).message
      });

      throw error;
    }
  }

  async deleteAnalysisResult(userId: string, analysisResultId: string): Promise<boolean> {
    try {
      const analysisResultRepo = AppDataSource.getRepository(AnalysisResultEntity);
      const result = await analysisResultRepo.delete({ id: analysisResultId, userId });
      const success = result.affected !== undefined && result.affected > 0;

      await this.logAuditEvent({
        userId,
        action: 'delete',
        resourceType: 'analysis_result',
        resourceId: analysisResultId,
        success
      });

      return success;
    } catch (error) {
      await this.logAuditEvent({
        userId,
        action: 'delete',
        resourceType: 'analysis_result',
        resourceId: analysisResultId,
        success: false,
        errorMessage: (error as Error).message
      });

      throw error;
    }
  }

  async computeDataHash(data: string): Promise<string> {
    return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
  }

  async verifyDataIntegrity(data: string, expectedHash: string): Promise<boolean> {
    const computedHash = await this.computeDataHash(data);
    return computedHash === expectedHash;
  }

  private async logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const auditEntry: AuditLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    this.auditLogs.push(auditEntry);

    const logLine = JSON.stringify({
      ...auditEntry,
      timestamp: auditEntry.timestamp.toISOString()
    });

    const logKey = crypto.createHash('sha256').update(process.env.AUDIT_LOG_KEY!).digest();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', logKey, iv);
    const ciphertext = Buffer.concat([cipher.update(logLine, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const record = Buffer.concat([iv, authTag, ciphertext]).toString('base64') + '\n';
    const auditPath = path.join(process.cwd(), 'audit.log.enc');
    await fs.appendFile(auditPath, record, { encoding: 'utf8' });
  }

  async getAuditLogs(userId: string, limit: number = 100): Promise<AuditLogEntry[]> {
    return this.auditLogs
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getAllAuditLogs(limit: number = 1000): Promise<AuditLogEntry[]> {
    return this.auditLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}
