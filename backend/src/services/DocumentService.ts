import { AppDataSource } from '../config/database';
import { Document, DocumentStatus, DocumentType } from '../entities/Document';
import { User } from '../entities/User';
import { AnalysisResult } from '../entities/AnalysisResult';
import { EncryptionService } from './EncryptionService';
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
  private static readonly MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760');
  private static readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/tiff',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  async validateDocument(
    file: MulterFile,
    userId: string
  ): Promise<DocumentValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (file.size > DocumentService.MAX_FILE_SIZE) {
      errors.push(`File size ${file.size} exceeds maximum allowed size ${DocumentService.MAX_FILE_SIZE}`);
    }

    if (!DocumentService.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} is not allowed`);
    }

    if (file.size === 0) {
      errors.push('File is empty');
    }

    try {
      if (file.mimetype === 'application/pdf') {
        if (!file.buffer.slice(0, 4).equals(Buffer.from('%PDF'))) {
          errors.push('File does not appear to be a valid PDF');
        }
      }
    } catch (error) {
      warnings.push('Could not perform content validation');
    }

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

  async uploadDocument(
    file: MulterFile,
    userId: string,
    metadata: {
      documentType?: DocumentType;
      originalFileName?: string;
      analysisRequested?: boolean;
    } = {}
  ): Promise<DocumentUploadResult> {
    const validation = await this.validateDocument(file, userId);
    if (!validation.isValid) {
      throw new Error(`Document validation failed: ${validation.errors.join(', ')}`);
    }

    const fileId = crypto.randomUUID();
    const fileExtension = path.extname(file.originalname || 'unknown');
    const uniqueFileName = `${fileId}${fileExtension}`;
    const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');

    const uploadPath = path.join(DocumentService.UPLOAD_DIR, userId, uniqueFileName);
    await fs.mkdir(path.dirname(uploadPath), { recursive: true });

    const encryptionService = new EncryptionService();
    const encrypted = await encryptionService.encryptBuffer(file.buffer);
    await fs.writeFile(uploadPath, encrypted.ciphertext);

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
      isEncrypted: true,
      encryptionKeySalt: encrypted.salt,
      encryptionIv: encrypted.iv
    });

    const savedDocument = await documentRepo.save(document);

    return {
      document: savedDocument,
      uploadPath,
      checksum
    };
  }

  async getDocument(userId: string, documentId: string): Promise<Document | null> {
    const documentRepo = AppDataSource.getRepository(Document);
    return documentRepo.findOne({
      where: { id: documentId, userId },
      relations: ['user', 'analysisResults']
    });
  }

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

  async downloadDocument(userId: string, documentId: string): Promise<Buffer | null> {
    const document = await this.getDocument(userId, documentId);
    if (!document || !document.filePath) {
      return null;
    }

    try {
      const ciphertext = await fs.readFile(document.filePath);
      if (!document.isEncrypted || !document.encryptionKeySalt || !document.encryptionIv) {
        return null;
      }
      const encService = new EncryptionService();
      return await encService.decryptBuffer(ciphertext, document.encryptionKeySalt, document.encryptionIv, document.encryptionAuthTag || '');
    } catch (error) {
      console.error('Failed to read document file:', error);
      return null;
    }
  }

  async updateDocumentStatus(
    userId: string,
    documentId: string,
    status: DocumentStatus,
    analysisResultId?: string,
    analysisError?: string
  ): Promise<Document | null> {
    const documentRepo = AppDataSource.getRepository(Document);
    const document = await this.getDocument(userId, documentId);
    if (!document) return null;

    document.status = status;
    document.analyzedAt = status === DocumentStatus.ANALYZED ? new Date() : document.analyzedAt;
    document.analysisError = analysisError;

    if (analysisResultId) {
      const analysisResultRepo = AppDataSource.getRepository(AnalysisResult);
      const analysisResult = await analysisResultRepo.findOne({ where: { id: analysisResultId } });
      if (analysisResult) {
        document.analysisResults = document.analysisResults || [];
        document.analysisResults.push(analysisResult);
      }
    }

    return documentRepo.save(document);
  }
}
