import { Repository } from 'typeorm';
import { User } from '../entities/User';
import { Role, Permission } from '../entities/Role';
import { UserRole } from '../entities/UserRole';
import { AppDataSource } from '../config/database';
import { HealthcareRole } from '../entities/User';

export interface RoleDefinition {
  name: string;
  permissions: Permission[];
  description: string;
  healthcareContext?: string;
}

export class RBACService {
  private userRepository: Repository<User>;
  private roleRepository: Repository<Role>;
  private userRoleRepository: Repository<UserRole>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.roleRepository = AppDataSource.getRepository(Role);
    this.userRoleRepository = AppDataSource.getRepository(UserRole);
  }

  // Initialize default roles for healthcare system
  async initializeDefaultRoles(): Promise<void> {
    const defaultRoles: RoleDefinition[] = [
      {
        name: 'physician',
        permissions: [
          Permission.DOCUMENT_ANALYZE,
          Permission.DOCUMENT_READ,
          Permission.USER_READ,
          Permission.AUDIT_READ
        ],
        description: 'Licensed physicians with full access to analysis tools',
        healthcareContext: 'clinical'
      },
      {
        name: 'nurse_practitioner',
        permissions: [
          Permission.DOCUMENT_ANALYZE,
          Permission.DOCUMENT_READ,
          Permission.USER_READ,
          Permission.AUDIT_READ
        ],
        description: 'Nurse practitioners with clinical analysis access',
        healthcareContext: 'clinical'
      },
      {
        name: 'registered_nurse',
        permissions: [
          Permission.DOCUMENT_READ,
          Permission.USER_READ
        ],
        description: 'Registered nurses with read-only access',
        healthcareContext: 'clinical'
      },
      {
        name: 'medical_assistant',
        permissions: [
          Permission.DOCUMENT_READ,
          Permission.USER_READ
        ],
        description: 'Medical assistants with basic access',
        healthcareContext: 'clinical'
      },
      {
        name: 'billing_specialist',
        permissions: [
          Permission.DOCUMENT_ANALYZE,
          Permission.DOCUMENT_READ,
          Permission.BILLING_RULES_READ,
          Permission.BILLING_RULES_UPDATE,
          Permission.AUDIT_READ
        ],
        description: 'Billing specialists with analysis and billing rule access',
        healthcareContext: 'administrative'
      },
      {
        name: 'administrator',
        permissions: [
          Permission.USER_CREATE,
          Permission.USER_READ,
          Permission.USER_UPDATE,
          Permission.USER_DELETE,
          Permission.DOCUMENT_READ,
          Permission.ADMIN_USERS,
          Permission.ADMIN_SYSTEM,
          Permission.AUDIT_READ
        ],
        description: 'System administrators with full access',
        healthcareContext: 'administrative'
      },
      {
        name: 'compliance_officer',
        permissions: [
          Permission.AUDIT_READ,
          Permission.USER_READ,
          Permission.ADMIN_COMPLIANCE
        ],
        description: 'Compliance officers with audit and compliance access',
        healthcareContext: 'administrative'
      }
    ];

    for (const roleDef of defaultRoles) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: roleDef.name }
      });

      if (!existingRole) {
        const role = this.roleRepository.create({
          name: roleDef.name,
          permissions: roleDef.permissions,
          description: roleDef.description,
          healthcareContext: roleDef.healthcareContext
        });
        await this.roleRepository.save(role);
      }
    }
  }

  // Assign role to user
  async assignRole(userId: string, roleName: string, assignedBy?: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const role = await this.roleRepository.findOne({ where: { name: roleName, isActive: true } });

    if (!user || !role) {
      throw new Error('User or role not found');
    }

    // Check if user already has this role
    const existingUserRole = await this.userRoleRepository.findOne({
      where: { userId, roleId: role.id }
    });

    if (existingUserRole) {
      if (!existingUserRole.isActive) {
        // Reactivate the role
        existingUserRole.isActive = true;
        existingUserRole.assignedAt = new Date();
        existingUserRole.assignedBy = assignedBy;
        await this.userRoleRepository.save(existingUserRole);
      }
      return;
    }

    // Create new user-role assignment
    const userRole = this.userRoleRepository.create({
      userId,
      roleId: role.id,
      assignedBy,
      assignedAt: new Date()
    });

    await this.userRoleRepository.save(userRole);
  }

  // Remove role from user
  async removeRole(userId: string, roleName: string): Promise<void> {
    const role = await this.roleRepository.findOne({ where: { name: roleName } });
    if (!role) {
      throw new Error('Role not found');
    }

    const userRole = await this.userRoleRepository.findOne({
      where: { userId, roleId: role.id, isActive: true }
    });

    if (userRole) {
      userRole.isActive = false;
      await this.userRoleRepository.save(userRole);
    }
  }

  // Get user permissions
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId, isActive: true },
      relations: ['role']
    });

    const permissions = new Set<Permission>();

    for (const userRole of userRoles) {
      if (userRole.role && userRole.role.isActive) {
        userRole.role.permissions.forEach(permission => permissions.add(permission));
      }
    }

    return Array.from(permissions);
  }

  // Check if user has permission
  async hasPermission(userId: string, permission: Permission): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permission);
  }

  // Check if user has any of the permissions
  async hasAnyPermission(userId: string, permissions: Permission[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return permissions.some(permission => userPermissions.includes(permission));
  }

  // Check if user has all permissions
  async hasAllPermissions(userId: string, permissions: Permission[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return permissions.every(permission => userPermissions.includes(permission));
  }

  // Get user roles
  async getUserRoles(userId: string): Promise<Role[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId, isActive: true },
      relations: ['role']
    });

    return userRoles
      .filter(userRole => userRole.role && userRole.role.isActive)
      .map(userRole => userRole.role!);
  }

  // Get all roles
  async getAllRoles(): Promise<Role[]> {
    return await this.roleRepository.find({ where: { isActive: true } });
  }

  // Create custom role
  async createRole(roleDef: RoleDefinition): Promise<Role> {
    const existingRole = await this.roleRepository.findOne({
      where: { name: roleDef.name }
    });

    if (existingRole) {
      throw new Error('Role already exists');
    }

    const role = this.roleRepository.create({
      name: roleDef.name,
      permissions: roleDef.permissions,
      description: roleDef.description,
      healthcareContext: roleDef.healthcareContext
    });

    return await this.roleRepository.save(role);
  }

  // Update role permissions
  async updateRolePermissions(roleName: string, permissions: Permission[]): Promise<void> {
    const role = await this.roleRepository.findOne({ where: { name: roleName } });
    if (!role) {
      throw new Error('Role not found');
    }

    role.permissions = permissions;
    await this.roleRepository.save(role);
  }

  // Deactivate role
  async deactivateRole(roleName: string): Promise<void> {
    const role = await this.roleRepository.findOne({ where: { name: roleName } });
    if (!role) {
      throw new Error('Role not found');
    }

    role.isActive = false;
    await this.roleRepository.save(role);
  }

  // Auto-assign role based on healthcare role
  async autoAssignRole(user: User): Promise<void> {
    const roleMapping: Record<HealthcareRole, string> = {
      [HealthcareRole.PHYSICIAN]: 'physician',
      [HealthcareRole.NURSE_PRACTITIONER]: 'nurse_practitioner',
      [HealthcareRole.PHYSICIAN_ASSISTANT]: 'physician',
      [HealthcareRole.REGISTERED_NURSE]: 'registered_nurse',
      [HealthcareRole.MEDICAL_ASSISTANT]: 'medical_assistant',
      [HealthcareRole.ADMINISTRATOR]: 'administrator',
      [HealthcareRole.BILLING_SPECIALIST]: 'billing_specialist',
      [HealthcareRole.COMPLIANCE_OFFICER]: 'compliance_officer'
    };

    const roleName = roleMapping[user.healthcareRole];
    if (roleName) {
      await this.assignRole(user.id, roleName);
    }
  }
}
