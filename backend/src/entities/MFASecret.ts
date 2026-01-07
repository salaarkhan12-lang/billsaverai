import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';

export enum MFAType {
  TOTP = 'totp', // Time-based One-Time Password
  SMS = 'sms',
  EMAIL = 'email'
}

export enum MFAStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  REVOKED = 'revoked'
}

@Entity('mfa_secrets')
export class MFASecret {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  userId!: string;

  @Column({ type: 'enum', enum: MFAType, default: MFAType.TOTP })
  type!: MFAType;

  @Column({ type: 'text' })
  secret!: string; // Encrypted TOTP secret

  @Column({ type: 'text', nullable: true })
  backupCodes?: string; // Encrypted JSON array of backup codes

  @Column({ type: 'enum', enum: MFAStatus, default: MFAStatus.ACTIVE })
  status!: MFAStatus;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt?: Date;

  @Column({ type: 'int', default: 0 })
  failedAttempts!: number;

  @Column({ type: 'timestamp', nullable: true })
  lockedUntil?: Date;

  @Column({ type: 'text', nullable: true })
  phoneNumber?: string; // For SMS MFA

  @Column({ type: 'text', nullable: true })
  email?: string; // For email MFA

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne('User', 'mfaSecrets', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: any;

  // Computed properties
  get isActive(): boolean {
    return this.status === MFAStatus.ACTIVE;
  }

  get isLocked(): boolean {
    return this.lockedUntil ? this.lockedUntil > new Date() : false;
  }

  get isVerified(): boolean {
    return this.verifiedAt !== null;
  }
}
