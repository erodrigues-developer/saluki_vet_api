import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSaleItemOrigins1775000000000 implements MigrationInterface {
  name = 'AddSaleItemOrigins1775000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sale_items"
      ADD COLUMN IF NOT EXISTS "origin_type" varchar(50),
      ADD COLUMN IF NOT EXISTS "origin_reference_id" bigint
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_sale_items_origin"
      ON "sale_items" ("origin_type", "origin_reference_id")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_sale_items_sale_origin"
      ON "sale_items" ("sale_id", "origin_type", "origin_reference_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."uq_sale_items_sale_origin"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."idx_sale_items_origin"`,
    );
    await queryRunner.query(`
      ALTER TABLE "sale_items"
      DROP COLUMN IF EXISTS "origin_reference_id",
      DROP COLUMN IF EXISTS "origin_type"
    `);
  }
}
