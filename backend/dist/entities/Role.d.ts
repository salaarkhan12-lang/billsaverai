import { UserRole } from './UserRole';
export declare enum Permission {
    USER_CREATE = "user:create",
    USER_READ = "user:read",
    USER_UPDATE = "user:update",
    USER_DELETE = "user:delete",
    DOCUMENT_ANALYZE = "document:analyze",
    DOCUMENT_READ = "document:read",
    DOCUMENT_DELETE = "document:delete",
    BILLING_RULES_READ = "billing:rules:read",
    BILLING_RULES_UPDATE = "billing:rules:update",
    AUDIT_READ = "audit:read",
    ADMIN_USERS = "admin:users",
    ADMIN_SYSTEM = "admin:system",
    ADMIN_COMPLIANCE = "admin:compliance"
}
export declare class Role {
    id: string;
    name: string;
    description?: string;
    permissions: Permission[];
    isActive: boolean;
    healthcareContext?: string;
    createdAt: Date;
    updatedAt: Date;
    userRoles: UserRole[];
    hasPermission(permission: Permission): boolean;
    addPermission(permission: Permission): void;
    removePermission(permission: Permission): void;
}
//# sourceMappingURL=Role.d.ts.map