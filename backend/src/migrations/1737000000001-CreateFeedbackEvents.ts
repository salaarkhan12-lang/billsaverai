import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFeedbackEvents1737000000001 implements MigrationInterface {
    name = 'CreateFeedbackEvents1737000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
          CREATE TABLE IF NOT EXISTS "feedback_events" (
            "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            "userId" uuid NOT NULL,
            "analysisId" uuid,
            "payload" jsonb NOT NULL,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now()
          );
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_feedback_user_created" ON "feedback_events" ("userId", "createdAt")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_feedback_analysis_created" ON "feedback_events" ("analysisId", "createdAt")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "feedback_events"`);
    }
}
