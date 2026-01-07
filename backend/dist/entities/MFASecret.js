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
exports.MFASecret = exports.MFAStatus = exports.MFAType = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
var MFAType;
(function (MFAType) {
    MFAType["TOTP"] = "totp";
    MFAType["SMS"] = "sms";
    MFAType["EMAIL"] = "email";
})(MFAType || (exports.MFAType = MFAType = {}));
var MFAStatus;
(function (MFAStatus) {
    MFAStatus["ACTIVE"] = "active";
    MFAStatus["INACTIVE"] = "inactive";
    MFAStatus["REVOKED"] = "revoked";
})(MFAStatus || (exports.MFAStatus = MFAStatus = {}));
let MFASecret = class MFASecret {
    id;
    userId;
    type;
    secret; // Encrypted TOTP secret
    backupCodes; // Encrypted JSON array of backup codes
    status;
    verifiedAt;
    lastUsedAt;
    failedAttempts;
    lockedUntil;
    phoneNumber; // For SMS MFA
    email; // For email MFA
    createdAt;
    updatedAt;
    // Relations
    user;
    // Computed properties
    get isActive() {
        return this.status === MFAStatus.ACTIVE;
    }
    get isLocked() {
        return this.lockedUntil ? this.lockedUntil > new Date() : false;
    }
    get isVerified() {
        return this.verifiedAt !== null;
    }
};
exports.MFASecret = MFASecret;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MFASecret.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], MFASecret.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: MFAType, default: MFAType.TOTP }),
    __metadata("design:type", String)
], MFASecret.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], MFASecret.prototype, "secret", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], MFASecret.prototype, "backupCodes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: MFAStatus, default: MFAStatus.ACTIVE }),
    __metadata("design:type", String)
], MFASecret.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], MFASecret.prototype, "verifiedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], MFASecret.prototype, "lastUsedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], MFASecret.prototype, "failedAttempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], MFASecret.prototype, "lockedUntil", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], MFASecret.prototype, "phoneNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], MFASecret.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MFASecret.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], MFASecret.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.mfaSecrets, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", User_1.User)
], MFASecret.prototype, "user", void 0);
exports.MFASecret = MFASecret = __decorate([
    (0, typeorm_1.Entity)('mfa_secrets')
], MFASecret);
//# sourceMappingURL=MFASecret.js.map