import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification'
}

export enum HealthcareRole {
  PHYSICIAN = 'physician',
  NURSE_PRACTITIONER = 'nurse_practitioner',
  PHYSICIAN_ASSISTANT = 'physician_assistant',
  REGISTERED_NURSE = 'registered_nurse',
  MEDICAL_ASSISTANT = 'medical_assistant',
  ADMINISTRATOR = 'administrator',
  BILLING_SPECIALIST = 'billing_specialist',
  COMPLIANCE_OFFICER = 'compliance_officer'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Column({ length: 255 })
  firstName!: string;

  @Column({ length: 255 })
  lastName!: string;

  @Column({ type: 'text' })
  passwordHash!: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING_VERIFICATION })
  status!: UserStatus;

  @Column({ type: 'enum', enum: HealthcareRole })
  healthcareRole!: HealthcareRole;

  @Column({ type: 'text', nullable: true })
  licenseNumber?: string;

  @Column({ type: 'text', nullable: true })
  specialty?: string;

  @Column({ type: 'text', nullable: true })
  organization?: string;

  @Column({ type: 'boolean', default: false })
  mfaEnabled!: boolean;

  @Column({ type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  emailVerifiedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'int', default: 0 })
  failedLoginAttempts!: number;

  @Column({ type: 'timestamp', nullable: true })
  lockedUntil?: Date;

  @Column({ type: 'jsonb', nullable: true })
  profileData?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @OneToMany('Session', 'user')
  sessions!: any[];

  @OneToMany('UserRole', 'user')
  userRoles!: any[];

  @OneToMany('MFASecret', 'user')
  mfaSecrets!: any[];

  @OneToMany('Document', 'user')
  documents!: any[];

  @OneToMany('AnalysisResult', 'user')
  analysisResults!: any[];

  // Computed properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isLocked(): boolean {
    return this.lockedUntil ? this.lockedUntil > new Date() : false;
  }

  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }
}
