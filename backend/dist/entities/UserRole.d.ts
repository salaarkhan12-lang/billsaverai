import { User } from './User';
import { Role } from './Role';
export declare class UserRole {
    id: string;
    userId: string;
    roleId: string;
    isActive: boolean;
    assignedAt?: Date;
    expiresAt?: Date;
    assignedBy?: string;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    role: Role;
    get isExpired(): boolean;
    get isValid(): boolean;
}
//# sourceMappingURL=UserRole.d.ts.map