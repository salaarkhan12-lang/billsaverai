import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { User } from './User';

export enum DocumentStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  ANALYZED = 'analyzed',
  FAILED = 'failed',
  DELETED = 'deleted'
}

export enum DocumentType {
  MEDICAL_NOTE = 'medical_note',
  LAB_RESULTS = 'lab_results',
  IMAGING_REPORT = 'imaging_report',
  CONSULTATION_NOTE = 'consultation_note',
  DISCHARGE_SUMMARY = 'discharge_summary',
  OTHER = 'other'
}

@Entity('documents')
@Index(['userId', 'createdAt'])
@Index(['userId', 'status'])
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  userId!: string;

  @Column({ length: 255 })
  fileName!: string;

  @Column({ length: 500, nullable: true })
  originalFileName?: string;

  @Column({ type: 'text', nullable: true })
  filePath?: string; // Path to encrypted file if stored on disk

  @Column({ type: 'bigint' })
  fileSize!: number; // File size in bytes

  @Column({ length: 100, nullable: true })
  mimeType?: string;

  @Column({ type: 'enum', enum: DocumentType, default: DocumentType.MEDICAL_NOTE })
  documentType!: DocumentType;

  @Column({ type: 'enum', enum: DocumentStatus, default: DocumentStatus.UPLOADED })
  status!: DocumentStatus;

  @Column({ type: 'text', nullable: true })
  checksum?: string; // SHA-256 hash for integrity verification

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>; // Additional metadata (page count, OCR confidence, etc.)

  @Column({ type: 'timestamp', nullable: true })
  analyzedAt?: Date;

  @Column({ type: 'text', nullable: true })
  analysisError?: string; // Error message if analysis failed

  @Column({ type: 'boolean', default: false })
  isEncrypted!: boolean; // Whether the document content is encrypted

  @Column({ type: 'text', nullable: true })
  encryptionKeySalt?: string; // Salt used for key derivation

  @Column({ type: 'text', nullable: true })
  encryptionIv?: string; // Initialization vector for encryption

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne('User', 'documents')
  @JoinColumn({ name: 'userId' })
  user!: User;

  @OneToMany('AnalysisResult', 'document')
  analysisResults!: any[];

  // Computed properties
  get isAnalyzed(): boolean {
    return this.status === DocumentStatus.ANALYZED;
  }

  get hasAnalysisResults(): boolean {
    return this.analysisResults && this.analysisResults.length > 0;
  }

  get latestAnalysisResult(): any {
    if (!this.analysisResults || this.analysisResults.length === 0) return null;
    return this.analysisResults.sort((a: any, b: any) => b.createdAt - a.createdAt)[0];
  }
}
