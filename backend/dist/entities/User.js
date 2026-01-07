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
exports.User = exports.HealthcareRole = exports.UserStatus = void 0;
const typeorm_1 = require("typeorm");
const Session_1 = require("./Session");
const UserRole_1 = require("./UserRole");
const MFASecret_1 = require("./MFASecret");
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["INACTIVE"] = "inactive";
    UserStatus["SUSPENDED"] = "suspended";
    UserStatus["PENDING_VERIFICATION"] = "pending_verification";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var HealthcareRole;
(function (HealthcareRole) {
    HealthcareRole["PHYSICIAN"] = "physician";
    HealthcareRole["NURSE_PRACTITIONER"] = "nurse_practitioner";
    HealthcareRole["PHYSICIAN_ASSISTANT"] = "physician_assistant";
    HealthcareRole["REGISTERED_NURSE"] = "registered_nurse";
    HealthcareRole["MEDICAL_ASSISTANT"] = "medical_assistant";
    HealthcareRole["ADMINISTRATOR"] = "administrator";
    HealthcareRole["BILLING_SPECIALIST"] = "billing_specialist";
    HealthcareRole["COMPLIANCE_OFFICER"] = "compliance_officer";
})(HealthcareRole || (exports.HealthcareRole = HealthcareRole = {}));
let User = class User {
    id;
    email;
    firstName;
    lastName;
    passwordHash;
    status;
    healthcareRole;
    licenseNumber;
    specialty;
    organization;
    mfaEnabled;
    emailVerified;
    emailVerifiedAt;
    lastLoginAt;
    failedLoginAttempts;
    lockedUntil;
    profileData;
    createdAt;
    updatedAt;
    // Relations
    sessions;
    userRoles;
    mfaSecrets;
    // Computed properties
    get fullName() {
        return `${this.firstName} ${this.lastName}`;
    }
    get isLocked() {
        return this.lockedUntil ? this.lockedUntil > new Date() : false;
    }
    get isActive() {
        return this.status === UserStatus.ACTIVE;
    }
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 255 }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], User.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], User.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING_VERIFICATION }),
    __metadata("design:type", String)
], User.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: HealthcareRole }),
    __metadata("design:type", String)
], User.prototype, "healthcareRole", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "licenseNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "specialty", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "mfaEnabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "emailVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "emailVerifiedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "lastLoginAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "failedLoginAttempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "lockedUntil", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "profileData", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Session_1.Session, session => session.user),
    __metadata("design:type", Array)
], User.prototype, "sessions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => UserRole_1.UserRole, userRole => userRole.user),
    __metadata("design:type", Array)
], User.prototype, "userRoles", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => MFASecret_1.MFASecret, mfaSecret => mfaSecret.user),
    __metadata("design:type", Array)
], User.prototype, "mfaSecrets", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
//# sourceMappingURL=User.js.map