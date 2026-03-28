import { MigrationInterface, QueryRunner } from "typeorm";

export class HardenAnalysisResultPHI1737000000000 implements MigrationInterface {
    name = 'HardenAnalysisResultPHI1737000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "analysis_results" DROP COLUMN IF EXISTS "overallScore"`);
        await queryRunner.query(`ALTER TABLE "analysis_results" DROP COLUMN IF EXISTS "documentationLevel"`);
        await queryRunner.query(`ALTER TABLE "analysis_results" DROP COLUMN IF EXISTS "totalPotentialRevenueLoss"`);
        await queryRunner.query(`ALTER TABLE "analysis_results" DROP COLUMN IF EXISTS "suggestedEMLevel"`);
        await queryRunner.query(`ALTER TABLE "analysis_results" DROP COLUMN IF EXISTS "searchIndex"`);
        await queryRunner.query(`ALTER TABLE "analysis_results" DROP COLUMN IF EXISTS "analysisError"`);
        await queryRunner.query(`ALTER TABLE "analysis_results" DROP COLUMN IF EXISTS "processingTimeMs"`);
        await queryRunner.query(`ALTER TABLE "analysis_results" DROP COLUMN IF EXISTS "mlMetadata"`);
        await queryRunner.query(`ALTER TABLE "analysis_results" ADD COLUMN "metadataSafe" jsonb NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "analysis_results" DROP COLUMN IF EXISTS "metadataSafe"`);
        await queryRunner.query(`ALTER TABLE "analysis_results" ADD COLUMN "mlMetadata" jsonb`);
        await queryRunner.query(`ALTER TABLE "analysis_results" ADD COLUMN "processingTimeMs" integer`);
        await queryRunner.query(`ALTER TABLE "analysis_results" ADD COLUMN "analysisError" text`);
        await queryRunner.query(`ALTER TABLE "analysis_results" ADD COLUMN "searchIndex" jsonb`);
        await queryRunner.query(`ALTER TABLE "analysis_results" ADD COLUMN "suggestedEMLevel" text`);
        await queryRunner.query(`ALTER TABLE "analysis_results" ADD COLUMN "totalPotentialRevenueLoss" text`);
        await queryRunner.query(`ALTER TABLE "analysis_results" ADD COLUMN "documentationLevel" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "analysis_results" ADD COLUMN "overallScore" integer`);
    }
}
