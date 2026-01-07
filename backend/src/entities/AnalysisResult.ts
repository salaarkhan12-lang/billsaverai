import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './User';
import { Document } from './Document';

export enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

@Entity('analysis_results')
@Index(['userId', 'createdAt'])
@Index(['documentId', 'createdAt'])
@Index(['userId', 'status'])
export class AnalysisResult {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  userId!: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  documentId?: string; // Optional link to uploaded document

  @Column({ type: 'text' })
  encryptedData!: string; // Encrypted JSON string containing AnalysisResult

  @Column({ type: 'text' })
  dataHash!: string; // SHA-256 hash of decrypted data for integrity verification

  @Column({ type: 'text' })
  encryptionKeySalt!: string; // Salt used for key derivation

  @Column({ type: 'text' })
  encryptionIv!: string; // Initialization vector for AES-GCM

  @Column({ type: 'text', nullable: true })
  encryptionAuthTag?: string; // Authentication tag for AES-GCM

  @Column({ type: 'enum', enum: AnalysisStatus, default: AnalysisStatus.PENDING })
  status!: AnalysisStatus;

  @Column({ type: 'int', nullable: true })
  overallScore?: number; // Cached score for queries (not encrypted)

  @Column({ length: 50, nullable: true })
  documentationLevel?: string; // Cached level for queries (not encrypted)

  @Column({ type: 'text', nullable: true })
  totalPotentialRevenueLoss?: string; // Cached revenue loss for queries (not encrypted)

  @Column({ type: 'text', nullable: true })
  suggestedEMLevel?: string; // Cached E/M level for queries (not encrypted)

  @Column({ type: 'jsonb', nullable: true })
  searchIndex?: Record<string, any>; // Encrypted search index for gaps, diagnoses, etc.

  @Column({ type: 'text', nullable: true })
  analysisError?: string; // Error message if analysis failed

  @Column({ type: 'int', nullable: true })
  processingTimeMs?: number; // Time taken to process analysis

  @Column({ type: 'jsonb', nullable: true })
  mlMetadata?: Record<string, any>; // ML model versions, confidence scores, etc.

  @Column({ type: 'boolean', default: false })
  isMigrated!: boolean; // Whether this result was migrated from localStorage

  @Column({ type: 'text', nullable: true })
  migrationSource?: string; // Source of migration (e.g., 'localStorage')

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne('User', 'analysisResults')
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne('Document', 'analysisResults')
  @JoinColumn({ name: 'documentId' })
  document?: Document;

  // Computed properties
  get isCompleted(): boolean {
    return this.status === AnalysisStatus.COMPLETED;
  }

  get isFailed(): boolean {
    return this.status === AnalysisStatus.FAILED;
  }

  get hasDocument(): boolean {
    return !!this.documentId;
  }

  get isEncrypted(): boolean {
    return !!this.encryptedData && !!this.encryptionIv;
  }
}
