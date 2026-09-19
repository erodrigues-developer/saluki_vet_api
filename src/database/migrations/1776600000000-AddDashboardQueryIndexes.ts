import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDashboardQueryIndexes1776600000000 implements MigrationInterface {
  name = 'AddDashboardQueryIndexes1776600000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_appointments_dashboard_date_status" ON "appointments" ("starts_at", "status_id") WHERE "deleted_at" IS NULL`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_sales_dashboard_date_status" ON "sales" ("sale_date", "status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_payments_dashboard_paid_at" ON "payments" ("paid_at")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_consultations_dashboard_visit_date" ON "consultations" ("visit_date")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_pet_vaccines_dashboard_due" ON "pet_vaccines" ("due_date", "pet_id", "vaccine_id") WHERE "due_date" IS NOT NULL`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_consultation_procedures_dashboard" ON "consultation_procedures" ("consultation_id", "procedure_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_accounts_payable_dashboard_due_status" ON "accounts_payable" ("due_date", "status")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_accounts_payable_dashboard_due_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_consultation_procedures_dashboard"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_pet_vaccines_dashboard_due"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_consultations_dashboard_visit_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_payments_dashboard_paid_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_sales_dashboard_date_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_appointments_dashboard_date_status"`);
  }
}
