// Backend encryption service for data validation and integrity checks
// Handles server-side encryption validation and audit logging

import { AppDataSource } from '../config/database';
import { AnalysisResult as AnalysisResultEntity, AnalysisStatus } from '../entities/AnalysisResult';
import { User } from '../entities/User';
import crypto from 'crypto';

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

  /**
   * Validates encrypted data structure and integrity
   */
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
      // Validate required fields
      if (!encryptedData.encryptedResult) {
        errors.push('Encrypted result is missing');
      }
      if (!encryptedData.dataHash) {
        errors.push('Data hash is missing');
      }
      if (!encryptedData.encryptionIv) {
        errors.push('Encryption IV is missing');
      }
      if (!encryptedData.encryptionKeySalt) {
        errors.push('Encryption key salt is missing');
      }

      // Validate base64 encoding
      const base64Fields = [
        'encryptedResult',
        'dataHash',
        'encryptionIv',
        'encryptionKeySalt',
        'encryptionAuthTag'
      ];

      for (const field of base64Fields) {
        if (encryptedData[field as keyof typeof encryptedData]) {
          try {
            atob(encryptedData[field as keyof typeof encryptedData] as string);
          } catch {
            errors.push(`${field} is not valid base64`);
          }
        }
      }

      // Validate hash format (should be 64 character hex string)
      if (encryptedData.dataHash && !/^[a-f0-9]{64}$/i.test(encryptedData.dataHash)) {
        errors.push('Data hash is not a valid SHA-256 hash');
      }

      // Check for weak encryption parameters
      if (encryptedData.encryptionKeySalt) {
        const salt = atob(encryptedData.encryptionKeySalt);
        if (salt.length < 16) {
          warnings.push('Encryption salt is shorter than recommended (16 bytes)');
        }
      }

      // Log validation attempt
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

  /**
   * Stores encrypted analysis result in database
   */
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
      // Validate the encrypted data first
      const validation = await this.validateEncryptedData(userId, encryptedData);
      if (!validation.isValid) {
        throw new Error(`Invalid encrypted data: ${validation.errors.join(', ')}`);
      }

      // Create the analysis result entity
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
        overallScore: metadata?.overallScore,
        documentationLevel: metadata?.documentationLevel,
        totalPotentialRevenueLoss: metadata?.totalPotentialRevenueLoss,
        suggestedEMLevel: metadata?.suggestedEMLevel,
        isMigrated: metadata?.isMigrated || false,
        migrationSource: metadata?.migrationSource,
      });

      const saved = await analysisResultRepo.save(analysisResult);

      // Log successful storage
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
      // Log failed storage attempt
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

  /**
   * Retrieves encrypted analysis result from database
   */
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
        // Log successful retrieval
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
      // Log failed retrieval
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

  /**
   * Lists analysis results for a user
   */
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

      if (options.limit) {
        queryBuilder.limit(options.limit);
      }

      if (options.offset) {
        queryBuilder.offset(options.offset);
      }

      const results = await queryBuilder.getMany();

      // Log access
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

  /**
   * Deletes an analysis result
   */
  async deleteAnalysisResult(userId: string, analysisResultId: string): Promise<boolean> {
    try {
      const analysisResultRepo = AppDataSource.getRepository(AnalysisResultEntity);
      const result = await analysisResultRepo.delete({
        id: analysisResultId,
        userId
      });

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

  /**
   * Computes hash of data for integrity verification (server-side)
   */
  async computeDataHash(data: string): Promise<string> {
    return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
  }

  /**
   * Verifies data integrity by comparing hashes
   */
  async verifyDataIntegrity(data: string, expectedHash: string): Promise<boolean> {
    const computedHash = await this.computeDataHash(data);
    return computedHash === expectedHash;
  }

  /**
   * Logs audit events for compliance
   */
  private async logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const auditEntry: AuditLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    // In production, this should be stored in a secure audit log database
    // For now, we'll keep it in memory (should be persisted to database)
    this.auditLogs.push(auditEntry);

    // Log to console for development
    console.log('Audit Event:', {
      userId: entry.userId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      success: entry.success,
      errorMessage: entry.errorMessage
    });
  }

  /**
   * Gets audit logs for a user (admin function)
   */
  async getAuditLogs(userId: string, limit: number = 100): Promise<AuditLogEntry[]> {
    return this.auditLogs
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Gets audit logs for all users (admin function)
   */
  async getAllAuditLogs(limit: number = 1000): Promise<AuditLogEntry[]> {
    return this.auditLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Generates encryption statistics for monitoring
   */
  async getEncryptionStats(): Promise<{
    totalAnalysisResults: number;
    migratedResults: number;
    averageEncryptionTime: number;
    failedEncryptions: number;
  }> {
    try {
      const analysisResultRepo = AppDataSource.getRepository(AnalysisResultEntity);
      const [total, migrated] = await Promise.all([
        analysisResultRepo.count(),
        analysisResultRepo.count({ where: { isMigrated: true } })
      ]);

      // Calculate stats from audit logs
      const encryptionEvents = this.auditLogs.filter(log => log.action === 'encrypt');
      const successfulEncryptions = encryptionEvents.filter(log => log.success);
      const failedEncryptions = encryptionEvents.filter(log => !log.success);

      return {
        totalAnalysisResults: total,
        migratedResults: migrated,
        averageEncryptionTime: 0, // Would need timing data from audit logs
        failedEncryptions: failedEncryptions.length
      };
    } catch (error) {
      console.error('Failed to get encryption stats:', error);
      throw error;
    }
  }
}
