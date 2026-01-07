"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const RBACService_1 = require("../services/RBACService");
async function migrate() {
    try {
        console.log('Initializing database connection...');
        await database_1.AppDataSource.initialize();
        console.log('Database connection established');
        // Run migrations if in production
        if (process.env.NODE_ENV === 'production') {
            console.log('Running migrations...');
            await database_1.AppDataSource.runMigrations();
            console.log('Migrations completed');
        }
        else {
            // Synchronize in development
            console.log('Synchronizing database schema...');
            await database_1.AppDataSource.synchronize();
            console.log('Schema synchronized');
        }
        // Initialize default roles
        console.log('Initializing default roles...');
        const rbacService = new RBACService_1.RBACService();
        await rbacService.initializeDefaultRoles();
        console.log('Default roles initialized');
        console.log('Migration completed successfully');
        process.exit(0);
    }
    catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}
migrate();
//# sourceMappingURL=migrate.js.map