// Document service for managing medical document uploads and metadata
// Handles file storage, validation, and document lifecycle

import { AppDataSource } from '../config/database';
import { Document, DocumentStatus, DocumentType } from '../entities/Document';
import { User } from '../entities/User';
import { AnalysisResult } from '../entities/AnalysisResult';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

export interface DocumentUploadResult {
  document: Document;
  uploadPath?: string;
  checksum: string;
}

export interface DocumentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: {
    pageCount?: number;
    hasText?: boolean;
    fileType?: string;
  };
}

export class DocumentService {
  private static readonly UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
  private static readonly MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB
  private static readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/tiff',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  /**
   * Validates document before upload
   */
  async validateDocument(
    file: MulterFile,
    userId: string
  ): Promise<DocumentValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file size
    if (file.size > DocumentService.MAX_FILE_SIZE) {
      errors.push(`File size ${file.size} exceeds maximum allowed size ${DocumentService.MAX_FILE_SIZE}`);
    }

    // Check MIME type
    if (!DocumentService.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} is not allowed`);
    }

    // Check for empty files
    if (file.size === 0) {
      errors.push('File is empty');
    }

    // Basic content validation
    try {
      // For PDFs, we could add more sophisticated validation here
      if (file.mimetype === 'application/pdf') {
        if (!file.buffer.slice(0, 4).equals(Buffer.from('%PDF'))) {
          errors.push('File does not appear to be a valid PDF');
        }
      }
    } catch (error) {
      warnings.push('Could not perform content validation');
    }

    // Check user permissions (placeholder for future RBAC)
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: userId }
    });

    if (!user) {
      errors.push('User not found');
    } else if (!user.isActive) {
      errors.push('User account is not active');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        fileType: file.mimetype,
        hasText: file.mimetype === 'text/plain' || file.mimetype === 'application/pdf'
      }
    };
  }

  /**
   * Uploads and stores a document
   */
  async uploadDocument(
    file: MulterFile,
    userId: string,
    metadata: {
      documentType?: DocumentType;
      originalFileName?: string;
      analysisRequested?: boolean;
    } = {}
  ): Promise<DocumentUploadResult> {
    // Validate the document first
    const validation = await this.validateDocument(file, userId);
    if (!validation.isValid) {
      throw new Error(`Document validation failed: ${validation.errors.join(', ')}`);
    }

    // Generate unique filename and compute checksum
    const fileId = crypto.randomUUID();
    const fileExtension = path.extname(file.originalname || 'unknown');
    const uniqueFileName = `${fileId}${fileExtension}`;
    const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');

    // Determine upload path
    const uploadPath = path.join(DocumentService.UPLOAD_DIR, userId, uniqueFileName);

    // Ensure upload directory exists
    await fs.mkdir(path.dirname(uploadPath), { recursive: true });

    // Write file to disk
    await fs.writeFile(uploadPath, file.buffer);

    // Create document record
    const documentRepo = AppDataSource.getRepository(Document);
    const document = documentRepo.create({
      userId,
      fileName: uniqueFileName,
      originalFileName: metadata.originalFileName || file.originalname,
      filePath: uploadPath,
      fileSize: file.size,
      mimeType: file.mimetype,
      documentType: metadata.documentType || DocumentType.MEDICAL_NOTE,
      status: metadata.analysisRequested ? DocumentStatus.PROCESSING : DocumentStatus.UPLOADED,
      checksum,
      isEncrypted: false, // Files are stored unencrypted on disk, analysis results are encrypted
    });

    const savedDocument = await documentRepo.save(document);

    return {
      document: savedDocument,
      uploadPath,
      checksum
    };
  }

  /**
   * Retrieves a document by ID
   */
  async getDocument(userId: string, documentId: string): Promise<Document | null> {
    const documentRepo = AppDataSource.getRepository(Document);
    return documentRepo.findOne({
      where: { id: documentId, userId },
      relations: ['user', 'analysisResults']
    });
  }

  /**
   * Lists documents for a user
   */
  async listUserDocuments(
    userId: string,
    options: {
      status?: DocumentStatus;
      documentType?: DocumentType;
      limit?: number;
      offset?: number;
      includeAnalysisResults?: boolean;
    } = {}
  ): Promise<Document[]> {
    const documentRepo = AppDataSource.getRepository(Document);
    const queryBuilder = documentRepo.createQueryBuilder('doc')
      .where('doc.userId = :userId', { userId })
      .orderBy('doc.createdAt', 'DESC');

    if (options.status) {
      queryBuilder.andWhere('doc.status = :status', { status: options.status });
    }

    if (options.documentType) {
      queryBuilder.andWhere('doc.documentType = :documentType', { documentType: options.documentType });
    }

    if (options.limit) {
      queryBuilder.limit(options.limit);
    }

    if (options.offset) {
      queryBuilder.offset(options.offset);
    }

    if (options.includeAnalysisResults) {
      queryBuilder.leftJoinAndSelect('doc.analysisResults', 'ar');
    }

    return queryBuilder.getMany();
  }

  /**
   * Downloads a document file
   */
  async downloadDocument(userId: string, documentId: string): Promise<Buffer | null> {
    const document = await this.getDocument(userId, documentId);
    if (!document || !document.filePath) {
      return null;
    }

    try {
      return await fs.readFile(document.filePath);
    } catch (error) {
      console.error('Failed to read document file:', error);
      return null;
    }
  }

  /**
   * Updates document status
   */
  async updateDocumentStatus(
    userId: string,
    documentId: string,
    status: DocumentStatus,
    additionalData?: {
      analyzedAt?: Date;
      analysisError?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<Document | null> {
    const documentRepo = AppDataSource.getRepository(Document);
    const document = await documentRepo.findOne({
      where: { id: documentId, userId }
    });

    if (!document) {
      return null;
    }

    document.status = status;

    if (additionalData) {
      if (additionalData.analyzedAt) document.analyzedAt = additionalData.analyzedAt;
      if (additionalData.analysisError) document.analysisError = additionalData.analysisError;
      if (additionalData.metadata) {
        document.metadata = { ...document.metadata, ...additionalData.metadata };
      }
    }

    return documentRepo.save(document);
  }

  /**
   * Deletes a document and its file
   */
  async deleteDocument(userId: string, documentId: string): Promise<boolean> {
    const documentRepo = AppDataSource.getRepository(Document);
    const analysisResultRepo = AppDataSource.getRepository(AnalysisResult);

    // Find the document
    const document = await documentRepo.findOne({
      where: { id: documentId, userId },
      relations: ['analysisResults']
    });

    if (!document) {
      return false;
    }

    // Delete associated analysis results
    if (document.analysisResults && document.analysisResults.length > 0) {
      await analysisResultRepo.delete({ documentId: documentId });
    }

    // Delete the file if it exists
    if (document.filePath) {
      try {
        await fs.unlink(document.filePath);
      } catch (error) {
        console.warn('Failed to delete document file:', error);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete the document record
    await documentRepo.delete({ id: documentId, userId });

    return true;
  }

  /**
   * Gets document statistics for a user
   */
  async getDocumentStats(userId: string): Promise<{
    totalDocuments: number;
    documentsByStatus: Record<DocumentStatus, number>;
    documentsByType: Record<DocumentType, number>;
    totalSize: number;
    analyzedDocuments: number;
  }> {
    const documents = await this.listUserDocuments(userId);

    const stats = {
      totalDocuments: documents.length,
      documentsByStatus: {} as Record<DocumentStatus, number>,
      documentsByType: {} as Record<DocumentType, number>,
      totalSize: 0,
      analyzedDocuments: 0
    };

    documents.forEach(doc => {
      // Count by status
      stats.documentsByStatus[doc.status] = (stats.documentsByStatus[doc.status] || 0) + 1;

      // Count by type
      stats.documentsByType[doc.documentType] = (stats.documentsByType[doc.documentType] || 0) + 1;

      // Sum file sizes
      stats.totalSize += doc.fileSize;

      // Count analyzed documents
      if (doc.isAnalyzed) {
        stats.analyzedDocuments++;
      }
    });

    return stats;
  }

  /**
   * Searches documents by filename or metadata
   */
  async searchDocuments(
    userId: string,
    query: string,
    options: {
      limit?: number;
      searchInContent?: boolean; // Future: search in extracted text
    } = {}
  ): Promise<Document[]> {
    const documentRepo = AppDataSource.getRepository(Document);
    const searchQuery = `%${query.toLowerCase()}%`;

    const queryBuilder = documentRepo.createQueryBuilder('doc')
      .where('doc.userId = :userId', { userId })
      .andWhere('(LOWER(doc.fileName) LIKE :query OR LOWER(doc.originalFileName) LIKE :query)')
      .setParameters({ query: searchQuery })
      .orderBy('doc.createdAt', 'DESC');

    if (options.limit) {
      queryBuilder.limit(options.limit);
    }

    return queryBuilder.getMany();
  }

  /**
   * Cleans up old temporary files and failed uploads
   */
  async cleanupOldFiles(maxAgeDays: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    const documentRepo = AppDataSource.getRepository(Document);
    const oldDocuments = await documentRepo.find({
      where: {
        status: DocumentStatus.FAILED,
        createdAt: { $lt: cutoffDate } as any // TypeORM date comparison
      }
    });

    let deletedCount = 0;

    for (const doc of oldDocuments) {
      if (doc.filePath) {
        try {
          await fs.unlink(doc.filePath);
          deletedCount++;
        } catch (error) {
          console.warn(`Failed to delete old file ${doc.filePath}:`, error);
        }
      }
      await documentRepo.delete({ id: doc.id });
    }

    return deletedCount;
  }
}
