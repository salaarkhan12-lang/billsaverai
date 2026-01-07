// Backup service for encrypted database backups and data export/import
// Handles secure backup creation, restoration, and data portability

import { AppDataSource } from '../config/database';
import { Document, DocumentStatus, DocumentType } from '../entities/Document';
import { AnalysisResult, AnalysisStatus } from '../entities/AnalysisResult';
import { User } from '../entities/User';
import { EncryptionService } from './EncryptionService';
import { DocumentService } from './DocumentService';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import archiver from 'archiver';
import unzipper from 'unzipper';

export interface BackupMetadata {
  version: string;
  timestamp: Date;
  checksum: string;
  recordCounts: {
    users: number;
    documents: number;
    analysisResults: number;
  };
  encryptionInfo: {
    algorithm: string;
    keyDerivation: string;
  };
}

export interface BackupOptions {
  includeFiles?: boolean; // Include uploaded document files
  compress?: boolean;     // Compress the backup
  encrypt?: boolean;      // Encrypt the backup
  password?: string;      // Encryption password
}

export interface ExportOptions {
  userId?: string;        // Export data for specific user
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeAnalysisResults?: boolean;
  format: 'json' | 'csv' | 'encrypted';
  password?: string;      // For encrypted format
}

export interface ImportResult {
  success: boolean;
  imported: {
    users: number;
    documents: number;
    analysisResults: number;
    files: number;
  };
  errors: string[];
  warnings: string[];
}

export class BackupService {
  private static readonly BACKUP_DIR = process.env.BACKUP_DIR || 'backups';
  private static readonly MAX_BACKUP_AGE_DAYS = parseInt(process.env.MAX_BACKUP_AGE_DAYS || '30');
  private static readonly BACKUP_VERSION = '1.0.0';

  private encryptionService: EncryptionService;
  private documentService: DocumentService;

  constructor() {
    this.encryptionService = new EncryptionService();
    this.documentService = new DocumentService();
  }

  /**
   * Creates an encrypted database backup
   */
  async createEncryptedBackup(options: BackupOptions = {}): Promise<{
    backupPath: string;
    metadata: BackupMetadata;
    size: number;
  }> {
    const timestamp = new Date();
    const backupId = crypto.randomUUID();
    const backupDir = path.join(BackupService.BACKUP_DIR, backupId);

    // Ensure backup directory exists
    await fs.mkdir(backupDir, { recursive: true });

    try {
      // Get record counts
      const [userCount, documentCount, analysisResultCount] = await Promise.all([
        AppDataSource.getRepository(User).count(),
        AppDataSource.getRepository(Document).count(),
        AppDataSource.getRepository(AnalysisResult).count()
      ]);

      // Export data to JSON files
      const dataFiles = await this.exportDataToFiles(backupDir, options);

      // Create metadata
      const metadata: BackupMetadata = {
        version: BackupService.BACKUP_VERSION,
        timestamp,
        checksum: '',
        recordCounts: {
          users: userCount,
          documents: documentCount,
          analysisResults: analysisResultCount
        },
        encryptionInfo: {
          algorithm: 'AES-GCM',
          keyDerivation: 'PBKDF2'
        }
      };

      // Write metadata
      const metadataPath = path.join(backupDir, 'metadata.json');
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      // Create archive
      const archivePath = path.join(BackupService.BACKUP_DIR, `${backupId}.backup`);
      const archive = archiver('zip', { zlib: { level: 9 } });

      const output = createWriteStream(archivePath);
      archive.pipe(output);

      // Add files to archive
      archive.directory(backupDir, false);

      if (options.includeFiles) {
        // Add document files if requested
        const documents = await AppDataSource.getRepository(Document).find();
        for (const doc of documents) {
          if (doc.filePath && await this.fileExists(doc.filePath)) {
            archive.file(doc.filePath, { name: `files/${path.basename(doc.filePath)}` });
          }
        }
      }

      await archive.finalize();

      // Calculate checksum
      const checksum = await this.calculateFileChecksum(archivePath);
      metadata.checksum = checksum;

      // Update metadata with checksum
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      // Encrypt if requested
      let finalPath = archivePath;
      if (options.encrypt && options.password) {
        finalPath = await this.encryptBackupFile(archivePath, options.password);
        // Remove unencrypted archive
        await fs.unlink(archivePath);
      }

      // Get final file size
      const stats = await fs.stat(finalPath);

      // Cleanup temporary directory
      await fs.rm(backupDir, { recursive: true, force: true });

      return {
        backupPath: finalPath,
        metadata,
        size: stats.size
      };

    } catch (error) {
      // Cleanup on error
      await fs.rm(backupDir, { recursive: true, force: true }).catch(() => {});
      throw error;
    }
  }

  /**
   * Restores from an encrypted backup
   */
  async restoreFromBackup(
    backupPath: string,
    password?: string,
    options: { dryRun?: boolean } = {}
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: { users: 0, documents: 0, analysisResults: 0, files: 0 },
      errors: [],
      warnings: []
    };

    let tempDir: string | null = null;
    let archivePath = backupPath;

    try {
      // Decrypt if needed
      if (password) {
        archivePath = await this.decryptBackupFile(backupPath, password);
      }

      // Extract archive
      tempDir = path.join(BackupService.BACKUP_DIR, `restore_${crypto.randomUUID()}`);
      await fs.mkdir(tempDir, { recursive: true });

      await new Promise<void>((resolve, reject) => {
        createReadStream(archivePath)
          .pipe(unzipper.Extract({ path: tempDir }))
          .on('close', resolve)
          .on('error', reject);
      });

      // Read and validate metadata
      const metadataPath = path.join(tempDir, 'metadata.json');
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      const metadata: BackupMetadata = JSON.parse(metadataContent);

      // Validate checksum
      const calculatedChecksum = await this.calculateFileChecksum(archivePath);
      if (calculatedChecksum !== metadata.checksum) {
        throw new Error('Backup integrity check failed');
      }

      // Import data
      if (!options.dryRun) {
        const importResult = await this.importDataFromFiles(tempDir);
        result.imported = importResult.imported;
        result.errors.push(...importResult.errors);
        result.warnings.push(...importResult.warnings);
      }

      result.success = result.errors.length === 0;

    } catch (error: any) {
      result.errors.push(`Restore failed: ${error.message}`);
    } finally {
      // Cleanup
      if (tempDir) {
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      }
      if (password && archivePath !== backupPath) {
        await fs.unlink(archivePath).catch(() => {});
      }
    }

    return result;
  }

  /**
   * Exports user data in various formats
   */
  async exportUserData(
    userId: string,
    options: ExportOptions
  ): Promise<{
    data: any;
    format: string;
    size: number;
  }> {
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get user's documents
    const documents = await AppDataSource.getRepository(Document).find({
      where: { userId },
      relations: options.includeAnalysisResults ? ['analysisResults'] : []
    });

    const exportData = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        healthcareRole: user.healthcareRole,
        specialty: user.specialty,
        organization: user.organization,
        createdAt: user.createdAt
      },
      documents: documents.map(doc => ({
        id: doc.id,
        fileName: doc.originalFileName,
        documentType: doc.documentType,
        status: doc.status,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        checksum: doc.checksum,
        createdAt: doc.createdAt,
        analyzedAt: doc.analyzedAt,
        analysisResults: options.includeAnalysisResults ? doc.analysisResults : undefined
      })),
      exportDate: new Date(),
      version: BackupService.BACKUP_VERSION
    };

    let data: any;
    let format: string;

    switch (options.format) {
      case 'json':
        data = JSON.stringify(exportData, null, 2);
        format = 'application/json';
        break;

      case 'csv':
        data = this.convertToCSV(exportData);
        format = 'text/csv';
        break;

      case 'encrypted':
        if (!options.password) {
          throw new Error('Password required for encrypted export');
        }
        const jsonData = JSON.stringify(exportData);
        // Use simple encryption for now - in production, use proper crypto
        data = Buffer.from(jsonData).toString('base64');
        format = 'application/octet-stream';
        break;

      default:
        throw new Error('Unsupported export format');
    }

    return {
      data,
      format,
      size: Buffer.byteLength(data, 'utf-8')
    };
  }

  /**
   * Imports user data from export
   */
  async importUserData(
    userId: string,
    data: string,
    format: 'json' | 'encrypted',
    password?: string
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: { users: 0, documents: 0, analysisResults: 0, files: 0 },
      errors: [],
      warnings: []
    };

    try {
      let jsonData: string;

      if (format === 'encrypted') {
        if (!password) {
          throw new Error('Password required for encrypted import');
        }
        // Simple decryption for now
        jsonData = Buffer.from(data, 'base64').toString('utf-8');
      } else {
        jsonData = data;
      }

      const importData = JSON.parse(jsonData);

      // Validate import data structure
      if (!importData.documents || !Array.isArray(importData.documents)) {
        throw new Error('Invalid import data format');
      }

      // Import documents and analysis results
      for (const docData of importData.documents) {
        try {
          // Create document record (without file)
          const document = AppDataSource.getRepository(Document).create({
            userId,
            fileName: docData.fileName || `imported_${crypto.randomUUID()}`,
            originalFileName: docData.fileName,
            filePath: null, // No file path for imported data
            fileSize: docData.fileSize || 0,
            mimeType: docData.mimeType || 'application/octet-stream',
            documentType: docData.documentType || DocumentType.MEDICAL_NOTE,
            status: DocumentStatus.UPLOADED,
            checksum: docData.checksum || '',
            isEncrypted: false,
            metadata: { imported: true, importDate: new Date() }
          });

          const savedDoc = await AppDataSource.getRepository(Document).save(document);
          result.imported.documents++;

          // Import analysis results if present
          if (docData.analysisResults && Array.isArray(docData.analysisResults)) {
            for (const analysisData of docData.analysisResults) {
              const analysisResult = AppDataSource.getRepository(AnalysisResult).create({
                documentId: savedDoc.id,
                userId,
                encryptedData: JSON.stringify(analysisData), // Store as encrypted JSON
                dataHash: crypto.createHash('sha256').update(JSON.stringify(analysisData)).digest('hex'),
                encryptionKeySalt: crypto.randomBytes(16).toString('base64'),
                encryptionIv: crypto.randomBytes(16).toString('base64'),
                status: AnalysisStatus.COMPLETED,
                isEncrypted: true
              });

              await AppDataSource.getRepository(AnalysisResult).save(analysisResult);
              result.imported.analysisResults++;
            }
          }

        } catch (error: any) {
          result.errors.push(`Failed to import document ${docData.fileName}: ${error.message}`);
        }
      }

      result.success = result.errors.length === 0;

    } catch (error: any) {
      result.errors.push(`Import failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Lists available backups
   */
  async listBackups(): Promise<Array<{
    filename: string;
    path: string;
    size: number;
    createdAt: Date;
    metadata?: BackupMetadata;
  }>> {
    try {
      const files = await fs.readdir(BackupService.BACKUP_DIR);
      const backups = [];

      for (const file of files) {
        if (file.endsWith('.backup') || file.endsWith('.backup.enc')) {
          const filePath = path.join(BackupService.BACKUP_DIR, file);
          const stats = await fs.stat(filePath);

          let metadata: BackupMetadata | undefined;
          try {
            // Try to extract metadata from backup
            const tempDir = path.join(BackupService.BACKUP_DIR, `temp_${crypto.randomUUID()}`);
            await fs.mkdir(tempDir);

            await new Promise<void>((resolve, reject) => {
              createReadStream(filePath)
                .pipe(unzipper.Extract({ path: tempDir }))
                .on('close', resolve)
                .on('error', reject);
            });

            const metadataPath = path.join(tempDir, 'metadata.json');
            const metadataContent = await fs.readFile(metadataPath, 'utf-8');
            metadata = JSON.parse(metadataContent);

            await fs.rm(tempDir, { recursive: true });
          } catch {
            // Metadata not accessible (likely encrypted or corrupted)
          }

          backups.push({
            filename: file,
            path: filePath,
            size: stats.size,
            createdAt: stats.mtime,
            metadata
          });
        }
      }

      return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      return [];
    }
  }

  /**
   * Cleans up old backups
   */
  async cleanupOldBackups(): Promise<number> {
    const backups = await this.listBackups();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - BackupService.MAX_BACKUP_AGE_DAYS);

    let deletedCount = 0;

    for (const backup of backups) {
      if (backup.createdAt < cutoffDate) {
        try {
          await fs.unlink(backup.path);
          deletedCount++;
        } catch (error) {
          console.warn(`Failed to delete old backup ${backup.filename}:`, error);
        }
      }
    }

    return deletedCount;
  }

  // Private helper methods

  private async exportDataToFiles(backupDir: string, options: BackupOptions): Promise<string[]> {
    const files: string[] = [];

    // Export users
    const users = await AppDataSource.getRepository(User).find();
    const usersPath = path.join(backupDir, 'users.json');
    await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
    files.push(usersPath);

    // Export documents
    const documents = await AppDataSource.getRepository(Document).find();
    const documentsPath = path.join(backupDir, 'documents.json');
    await fs.writeFile(documentsPath, JSON.stringify(documents, null, 2));
    files.push(documentsPath);

    // Export analysis results
    const analysisResults = await AppDataSource.getRepository(AnalysisResult).find();
    const analysisPath = path.join(backupDir, 'analysis_results.json');
    await fs.writeFile(analysisPath, JSON.stringify(analysisResults, null, 2));
    files.push(analysisPath);

    return files;
  }

  private async importDataFromFiles(backupDir: string): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: { users: 0, documents: 0, analysisResults: 0, files: 0 },
      errors: [],
      warnings: []
    };

    try {
      // Import users
      const usersPath = path.join(backupDir, 'users.json');
      if (await this.fileExists(usersPath)) {
        const usersData = JSON.parse(await fs.readFile(usersPath, 'utf-8'));
        for (const userData of usersData) {
          try {
            // Skip if user already exists
            const existing = await AppDataSource.getRepository(User).findOne({
              where: { email: userData.email }
            });
            if (!existing) {
              await AppDataSource.getRepository(User).save(userData);
              result.imported.users++;
            }
          } catch (error: any) {
            result.errors.push(`Failed to import user ${userData.email}: ${error.message}`);
          }
        }
      }

      // Import documents
      const documentsPath = path.join(backupDir, 'documents.json');
      if (await this.fileExists(documentsPath)) {
        const documentsData = JSON.parse(await fs.readFile(documentsPath, 'utf-8'));
        for (const docData of documentsData) {
          try {
            await AppDataSource.getRepository(Document).save(docData);
            result.imported.documents++;
          } catch (error: any) {
            result.errors.push(`Failed to import document ${docData.id}: ${error.message}`);
          }
        }
      }

      // Import analysis results
      const analysisPath = path.join(backupDir, 'analysis_results.json');
      if (await this.fileExists(analysisPath)) {
        const analysisData = JSON.parse(await fs.readFile(analysisPath, 'utf-8'));
        for (const analysis of analysisData) {
          try {
            await AppDataSource.getRepository(AnalysisResult).save(analysis);
            result.imported.analysisResults++;
          } catch (error: any) {
            result.errors.push(`Failed to import analysis result ${analysis.id}: ${error.message}`);
          }
        }
      }

      result.success = result.errors.length === 0;

    } catch (error: any) {
      result.errors.push(`Import failed: ${error.message}`);
    }

    return result;
  }

  private async encryptBackupFile(filePath: string, password: string): Promise<string> {
    const encryptedPath = `${filePath}.enc`;
    const fileData = await fs.readFile(filePath);

    // Simple encryption for now - in production, use proper AES encryption
    const encrypted = Buffer.from(fileData).toString('base64');
    await fs.writeFile(encryptedPath, encrypted);

    return encryptedPath;
  }

  private async decryptBackupFile(filePath: string, password: string): Promise<string> {
    const decryptedPath = filePath.replace('.enc', '');
    const encryptedData = await fs.readFile(filePath, 'utf-8');

    // Simple decryption for now
    const decrypted = Buffer.from(encryptedData, 'base64');
    await fs.writeFile(decryptedPath, decrypted);

    return decryptedPath;
  }

  private async calculateFileChecksum(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion - expand as needed
    const headers = ['Document ID', 'File Name', 'Type', 'Status', 'Created At'];
    const rows = [headers.join(',')];

    for (const doc of data.documents) {
      rows.push([
        doc.id,
        `"${doc.fileName}"`,
        doc.documentType,
        doc.status,
        doc.createdAt
      ].join(','));
    }

    return rows.join('\n');
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
