"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("../entities/User");
const Session_1 = require("../entities/Session");
const Role_1 = require("../entities/Role");
const UserRole_1 = require("../entities/UserRole");
const MFASecret_1 = require("../entities/MFASecret");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'billsaver',
    url: process.env.DATABASE_URL,
    synchronize: process.env.NODE_ENV === 'development', // Use migrations in production
    logging: process.env.NODE_ENV === 'development',
    entities: [User_1.User, Session_1.Session, Role_1.Role, UserRole_1.UserRole, MFASecret_1.MFASecret],
    migrations: ['src/migrations/*.ts'],
    subscribers: ['src/subscribers/*.ts'],
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    extra: {
        // Connection pool settings
        max: 20,
        min: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    }
});
//# sourceMappingURL=database.js.map