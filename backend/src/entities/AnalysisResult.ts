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
  documentId?: string;

  @Column({ type: 'text' })
  encryptedData!: string;

  @Column({ type: 'text' })
  dataHash!: string;

  @Column({ type: 'text' })
  encryptionKeySalt!: string;

  @Column({ type: 'text' })
  encryptionIv!: string;

  @Column({ type: 'text', nullable: true })
  encryptionAuthTag?: string;

  @Column({ type: 'enum', enum: AnalysisStatus, default: AnalysisStatus.PENDING })
  status!: AnalysisStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadataSafe?: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  isMigrated!: boolean;

  @Column({ type: 'text', nullable: true })
  migrationSource?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne('User', 'analysisResults')
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne('Document', 'analysisResults')
  @JoinColumn({ name: 'documentId' })
  document?: Document;

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
