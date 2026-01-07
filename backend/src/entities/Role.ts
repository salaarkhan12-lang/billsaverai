import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

export enum Permission {
  // User management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // Document analysis
  DOCUMENT_ANALYZE = 'document:analyze',
  DOCUMENT_READ = 'document:read',
  DOCUMENT_DELETE = 'document:delete',

  // Billing rules
  BILLING_RULES_READ = 'billing:rules:read',
  BILLING_RULES_UPDATE = 'billing:rules:update',

  // Audit logs
  AUDIT_READ = 'audit:read',

  // Admin permissions
  ADMIN_USERS = 'admin:users',
  ADMIN_SYSTEM = 'admin:system',
  ADMIN_COMPLIANCE = 'admin:compliance'
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb' })
  permissions!: Permission[];

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'text', nullable: true })
  healthcareContext?: string; // e.g., "clinical", "administrative", "billing"

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @OneToMany('UserRole', 'role')
  userRoles!: any[];

  // Helper methods
  hasPermission(permission: Permission): boolean {
    return this.permissions.includes(permission);
  }

  addPermission(permission: Permission): void {
    if (!this.permissions.includes(permission)) {
      this.permissions.push(permission);
    }
  }

  removePermission(permission: Permission): void {
    this.permissions = this.permissions.filter(p => p !== permission);
  }
}
