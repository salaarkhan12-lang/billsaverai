import { User } from '../entities/User';
import { Role, Permission } from '../entities/Role';
export interface RoleDefinition {
    name: string;
    permissions: Permission[];
    description: string;
    healthcareContext?: string;
}
export declare class RBACService {
    private userRepository;
    private roleRepository;
    private userRoleRepository;
    constructor();
    initializeDefaultRoles(): Promise<void>;
    assignRole(userId: string, roleName: string, assignedBy?: string): Promise<void>;
    removeRole(userId: string, roleName: string): Promise<void>;
    getUserPermissions(userId: string): Promise<Permission[]>;
    hasPermission(userId: string, permission: Permission): Promise<boolean>;
    hasAnyPermission(userId: string, permissions: Permission[]): Promise<boolean>;
    hasAllPermissions(userId: string, permissions: Permission[]): Promise<boolean>;
    getUserRoles(userId: string): Promise<Role[]>;
    getAllRoles(): Promise<Role[]>;
    createRole(roleDef: RoleDefinition): Promise<Role>;
    updateRolePermissions(roleName: string, permissions: Permission[]): Promise<void>;
    deactivateRole(roleName: string): Promise<void>;
    autoAssignRole(user: User): Promise<void>;
}
//# sourceMappingURL=RBACService.d.ts.map