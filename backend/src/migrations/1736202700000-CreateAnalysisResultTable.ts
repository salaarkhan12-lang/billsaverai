import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAnalysisResultTable1736202700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type
    await queryRunner.query(`
      CREATE TYPE "analysis_status_enum" AS ENUM(
        'pending',
        'processing',
        'completed',
        'failed'
      )
    `);

    // Create analysis_results table
    await queryRunner.query(`
      CREATE TABLE "analysis_results" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "documentId" uuid,
        "encryptedData" text NOT NULL,
        "dataHash" text NOT NULL,
        "encryptionKeySalt" text NOT NULL,
        "encryptionIv" text NOT NULL,
        "encryptionAuthTag" text,
        "status" "analysis_status_enum" NOT NULL DEFAULT 'pending',
        "overallScore" integer,
        "documentationLevel" character varying(50),
        "totalPotentialRevenueLoss" text,
        "suggestedEMLevel" text,
        "searchIndex" jsonb,
        "analysisError" text,
        "processingTimeMs" integer,
        "mlMetadata" jsonb,
        "isMigrated" boolean NOT NULL DEFAULT false,
        "migrationSource" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_analysis_results" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_analysis_results_user_created" ON "analysis_results" ("userId", "createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_analysis_results_document_created" ON "analysis_results" ("documentId", "createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_analysis_results_user_status" ON "analysis_results" ("userId", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_analysis_results_user" ON "analysis_results" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_analysis_results_document" ON "analysis_results" ("documentId")
    `);

    // Create foreign keys
    await queryRunner.query(`
      ALTER TABLE "analysis_results"
      ADD CONSTRAINT "FK_analysis_results_user"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "analysis_results"
      ADD CONSTRAINT "FK_analysis_results_document"
      FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(`ALTER TABLE "analysis_results" DROP CONSTRAINT "FK_analysis_results_document"`);
    await queryRunner.query(`ALTER TABLE "analysis_results" DROP CONSTRAINT "FK_analysis_results_user"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_analysis_results_user_created"`);
    await queryRunner.query(`DROP INDEX "IDX_analysis_results_document_created"`);
    await queryRunner.query(`DROP INDEX "IDX_analysis_results_user_status"`);
    await queryRunner.query(`DROP INDEX "IDX_analysis_results_user"`);
    await queryRunner.query(`DROP INDEX "IDX_analysis_results_document"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "analysis_results"`);

    // Drop enum type
    await queryRunner.query(`DROP TYPE "analysis_status_enum"`);
  }
}
