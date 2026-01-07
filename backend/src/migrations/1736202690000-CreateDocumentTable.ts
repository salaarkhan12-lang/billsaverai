import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentTable1736202690000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types first
    await queryRunner.query(`
      CREATE TYPE "document_status_enum" AS ENUM(
        'uploaded',
        'processing',
        'analyzed',
        'failed',
        'deleted'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "document_type_enum" AS ENUM(
        'medical_note',
        'lab_results',
        'imaging_report',
        'consultation_note',
        'discharge_summary',
        'other'
      )
    `);

    // Create documents table
    await queryRunner.query(`
      CREATE TABLE "documents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "fileName" character varying(255) NOT NULL,
        "originalFileName" character varying(500),
        "filePath" text,
        "fileSize" bigint NOT NULL,
        "mimeType" character varying(100),
        "documentType" "document_type_enum" NOT NULL DEFAULT 'medical_note',
        "status" "document_status_enum" NOT NULL DEFAULT 'uploaded',
        "checksum" text,
        "metadata" jsonb,
        "analyzedAt" TIMESTAMP,
        "analysisError" text,
        "isEncrypted" boolean NOT NULL DEFAULT false,
        "encryptionKeySalt" text,
        "encryptionIv" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_documents" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_documents_user_created" ON "documents" ("userId", "createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_documents_user_status" ON "documents" ("userId", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_documents_user" ON "documents" ("userId")
    `);

    // Create foreign key
    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD CONSTRAINT "FK_documents_user"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.query(`ALTER TABLE "documents" DROP CONSTRAINT "FK_documents_user"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_documents_user_created"`);
    await queryRunner.query(`DROP INDEX "IDX_documents_user_status"`);
    await queryRunner.query(`DROP INDEX "IDX_documents_user"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "documents"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "document_type_enum"`);
    await queryRunner.query(`DROP TYPE "document_status_enum"`);
  }
}
