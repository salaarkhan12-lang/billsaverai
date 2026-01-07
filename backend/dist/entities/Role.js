"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = exports.Permission = void 0;
const typeorm_1 = require("typeorm");
const UserRole_1 = require("./UserRole");
var Permission;
(function (Permission) {
    // User management
    Permission["USER_CREATE"] = "user:create";
    Permission["USER_READ"] = "user:read";
    Permission["USER_UPDATE"] = "user:update";
    Permission["USER_DELETE"] = "user:delete";
    // Document analysis
    Permission["DOCUMENT_ANALYZE"] = "document:analyze";
    Permission["DOCUMENT_READ"] = "document:read";
    Permission["DOCUMENT_DELETE"] = "document:delete";
    // Billing rules
    Permission["BILLING_RULES_READ"] = "billing:rules:read";
    Permission["BILLING_RULES_UPDATE"] = "billing:rules:update";
    // Audit logs
    Permission["AUDIT_READ"] = "audit:read";
    // Admin permissions
    Permission["ADMIN_USERS"] = "admin:users";
    Permission["ADMIN_SYSTEM"] = "admin:system";
    Permission["ADMIN_COMPLIANCE"] = "admin:compliance";
})(Permission || (exports.Permission = Permission = {}));
let Role = class Role {
    id;
    name;
    description;
    permissions;
    isActive;
    healthcareContext; // e.g., "clinical", "administrative", "billing"
    createdAt;
    updatedAt;
    // Relations
    userRoles;
    // Helper methods
    hasPermission(permission) {
        return this.permissions.includes(permission);
    }
    addPermission(permission) {
        if (!this.permissions.includes(permission)) {
            this.permissions.push(permission);
        }
    }
    removePermission(permission) {
        this.permissions = this.permissions.filter(p => p !== permission);
    }
};
exports.Role = Role;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Role.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 100 }),
    __metadata("design:type", String)
], Role.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Role.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Array)
], Role.prototype, "permissions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Role.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Role.prototype, "healthcareContext", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Role.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Role.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => UserRole_1.UserRole, userRole => userRole.role),
    __metadata("design:type", Array)
], Role.prototype, "userRoles", void 0);
exports.Role = Role = __decorate([
    (0, typeorm_1.Entity)('roles')
], Role);
//# sourceMappingURL=Role.js.map