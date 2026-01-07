import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';

export enum SessionStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired'
}

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  userId!: string;

  @Column({ type: 'text' })
  accessToken!: string;

  @Column({ type: 'text' })
  refreshToken!: string;

  @Column({ type: 'timestamp' })
  accessTokenExpiresAt!: Date;

  @Column({ type: 'timestamp' })
  refreshTokenExpiresAt!: Date;

  @Column({ type: 'enum', enum: SessionStatus, default: SessionStatus.ACTIVE })
  status!: SessionStatus;

  @Column({ type: 'text', nullable: true })
  ipAddress?: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @Column({ type: 'jsonb', nullable: true })
  deviceInfo?: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt?: Date;

  @Column({ type: 'text', nullable: true })
  revokedReason?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne('User', 'sessions', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: any;

  // Computed properties
  get isActive(): boolean {
    return this.status === SessionStatus.ACTIVE &&
           this.accessTokenExpiresAt > new Date() &&
           this.refreshTokenExpiresAt > new Date();
  }

  get isExpired(): boolean {
    return this.accessTokenExpiresAt <= new Date() ||
           this.refreshTokenExpiresAt <= new Date();
  }

  get isAccessTokenExpired(): boolean {
    return this.accessTokenExpiresAt <= new Date();
  }

  get isRefreshTokenExpired(): boolean {
    return this.refreshTokenExpiresAt <= new Date();
  }
}
