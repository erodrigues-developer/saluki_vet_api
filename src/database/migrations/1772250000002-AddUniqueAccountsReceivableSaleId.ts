import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueAccountsReceivableSaleId1772250000002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_accounts_receivable_sale_id_not_null"
      ON "accounts_receivable" ("sale_id")
      WHERE "sale_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "uq_accounts_receivable_sale_id_not_null"
    `);
  }
}
