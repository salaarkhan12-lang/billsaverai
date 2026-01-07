"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBACService = void 0;
const User_1 = require("../entities/User");
const Role_1 = require("../entities/Role");
const UserRole_1 = require("../entities/UserRole");
const database_1 = require("../config/database");
const User_2 = require("../entities/User");
class RBACService {
    userRepository;
    roleRepository;
    userRoleRepository;
    constructor() {
        this.userRepository = database_1.AppDataSource.getRepository(User_1.User);
        this.roleRepository = database_1.AppDataSource.getRepository(Role_1.Role);
        this.userRoleRepository = database_1.AppDataSource.getRepository(UserRole_1.UserRole);
    }
    // Initialize default roles for healthcare system
    async initializeDefaultRoles() {
        const defaultRoles = [
            {
                name: 'physician',
                permissions: [
                    Role_1.Permission.DOCUMENT_ANALYZE,
                    Role_1.Permission.DOCUMENT_READ,
                    Role_1.Permission.USER_READ,
                    Role_1.Permission.AUDIT_READ
                ],
                description: 'Licensed physicians with full access to analysis tools',
                healthcareContext: 'clinical'
            },
            {
                name: 'nurse_practitioner',
                permissions: [
                    Role_1.Permission.DOCUMENT_ANALYZE,
                    Role_1.Permission.DOCUMENT_READ,
                    Role_1.Permission.USER_READ,
                    Role_1.Permission.AUDIT_READ
                ],
                description: 'Nurse practitioners with clinical analysis access',
                healthcareContext: 'clinical'
            },
            {
                name: 'registered_nurse',
                permissions: [
                    Role_1.Permission.DOCUMENT_READ,
                    Role_1.Permission.USER_READ
                ],
                description: 'Registered nurses with read-only access',
                healthcareContext: 'clinical'
            },
            {
                name: 'medical_assistant',
                permissions: [
                    Role_1.Permission.DOCUMENT_READ,
                    Role_1.Permission.USER_READ
                ],
                description: 'Medical assistants with basic access',
                healthcareContext: 'clinical'
            },
            {
                name: 'billing_specialist',
                permissions: [
                    Role_1.Permission.DOCUMENT_ANALYZE,
                    Role_1.Permission.DOCUMENT_READ,
                    Role_1.Permission.BILLING_RULES_READ,
                    Role_1.Permission.BILLING_RULES_UPDATE,
                    Role_1.Permission.AUDIT_READ
                ],
                description: 'Billing specialists with analysis and billing rule access',
                healthcareContext: 'administrative'
            },
            {
                name: 'administrator',
                permissions: [
                    Role_1.Permission.USER_CREATE,
                    Role_1.Permission.USER_READ,
                    Role_1.Permission.USER_UPDATE,
                    Role_1.Permission.USER_DELETE,
                    Role_1.Permission.DOCUMENT_READ,
                    Role_1.Permission.ADMIN_USERS,
                    Role_1.Permission.ADMIN_SYSTEM,
                    Role_1.Permission.AUDIT_READ
                ],
                description: 'System administrators with full access',
                healthcareContext: 'administrative'
            },
            {
                name: 'compliance_officer',
                permissions: [
                    Role_1.Permission.AUDIT_READ,
                    Role_1.Permission.USER_READ,
                    Role_1.Permission.ADMIN_COMPLIANCE
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
    async assignRole(userId, roleName, assignedBy) {
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
    async removeRole(userId, roleName) {
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
    async getUserPermissions(userId) {
        const userRoles = await this.userRoleRepository.find({
            where: { userId, isActive: true },
            relations: ['role']
        });
        const permissions = new Set();
        for (const userRole of userRoles) {
            if (userRole.role && userRole.role.isActive) {
                userRole.role.permissions.forEach(permission => permissions.add(permission));
            }
        }
        return Array.from(permissions);
    }
    // Check if user has permission
    async hasPermission(userId, permission) {
        const permissions = await this.getUserPermissions(userId);
        return permissions.includes(permission);
    }
    // Check if user has any of the permissions
    async hasAnyPermission(userId, permissions) {
        const userPermissions = await this.getUserPermissions(userId);
        return permissions.some(permission => userPermissions.includes(permission));
    }
    // Check if user has all permissions
    async hasAllPermissions(userId, permissions) {
        const userPermissions = await this.getUserPermissions(userId);
        return permissions.every(permission => userPermissions.includes(permission));
    }
    // Get user roles
    async getUserRoles(userId) {
        const userRoles = await this.userRoleRepository.find({
            where: { userId, isActive: true },
            relations: ['role']
        });
        return userRoles
            .filter(userRole => userRole.role && userRole.role.isActive)
            .map(userRole => userRole.role);
    }
    // Get all roles
    async getAllRoles() {
        return await this.roleRepository.find({ where: { isActive: true } });
    }
    // Create custom role
    async createRole(roleDef) {
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
    async updateRolePermissions(roleName, permissions) {
        const role = await this.roleRepository.findOne({ where: { name: roleName } });
        if (!role) {
            throw new Error('Role not found');
        }
        role.permissions = permissions;
        await this.roleRepository.save(role);
    }
    // Deactivate role
    async deactivateRole(roleName) {
        const role = await this.roleRepository.findOne({ where: { name: roleName } });
        if (!role) {
            throw new Error('Role not found');
        }
        role.isActive = false;
        await this.roleRepository.save(role);
    }
    // Auto-assign role based on healthcare role
    async autoAssignRole(user) {
        const roleMapping = {
            [User_2.HealthcareRole.PHYSICIAN]: 'physician',
            [User_2.HealthcareRole.NURSE_PRACTITIONER]: 'nurse_practitioner',
            [User_2.HealthcareRole.PHYSICIAN_ASSISTANT]: 'physician',
            [User_2.HealthcareRole.REGISTERED_NURSE]: 'registered_nurse',
            [User_2.HealthcareRole.MEDICAL_ASSISTANT]: 'medical_assistant',
            [User_2.HealthcareRole.ADMINISTRATOR]: 'administrator',
            [User_2.HealthcareRole.BILLING_SPECIALIST]: 'billing_specialist',
            [User_2.HealthcareRole.COMPLIANCE_OFFICER]: 'compliance_officer'
        };
        const roleName = roleMapping[user.healthcareRole];
        if (roleName) {
            await this.assignRole(user.id, roleName);
        }
    }
}
exports.RBACService = RBACService;
//# sourceMappingURL=RBACService.js.map