import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Session } from '../entities/Session';
import { Role } from '../entities/Role';
import { UserRole } from '../entities/UserRole';
import { MFASecret } from '../entities/MFASecret';
import { Document } from '../entities/Document';
import { AnalysisResult } from '../entities/AnalysisResult';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'billsaver',
  url: process.env.DATABASE_URL,
  synchronize: process.env.NODE_ENV === 'development', // Use migrations in production
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Session, Role, UserRole, MFASecret, Document, AnalysisResult],
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
