import { AppDataSource } from '../config/database';
import { RBACService } from '../services/RBACService';

async function migrate() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('Database connection established');

    // Run migrations if in production
    if (process.env.NODE_ENV === 'production') {
      console.log('Running migrations...');
      await AppDataSource.runMigrations();
      console.log('Migrations completed');
    } else {
      // Synchronize in development
      console.log('Synchronizing database schema...');
      await AppDataSource.synchronize();
      console.log('Schema synchronized');
    }

    // Initialize default roles
    console.log('Initializing default roles...');
    const rbacService = new RBACService();
    await rbacService.initializeDefaultRoles();
    console.log('Default roles initialized');

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
