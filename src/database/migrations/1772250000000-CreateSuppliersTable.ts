import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSuppliersTable1772250000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const suppliersExists = await queryRunner.hasTable('suppliers');

    if (!suppliersExists) {
      await queryRunner.createTable(
        new Table({
          name: 'suppliers',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'name',
              type: 'varchar',
              length: '255',
            },
            {
              name: 'legal_name',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'document',
              type: 'varchar',
              length: '32',
              isNullable: true,
            },
            {
              name: 'email',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'phone',
              type: 'varchar',
              length: '50',
              isNullable: true,
            },
            {
              name: 'is_active',
              type: 'boolean',
              default: true,
            },
            {
              name: 'notes',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
        }),
      );
    }

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_suppliers_document_not_null"
      ON "suppliers" ("document")
      WHERE "document" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "UQ_suppliers_document_not_null"',
    );

    const suppliersExists = await queryRunner.hasTable('suppliers');
    if (suppliersExists) {
      await queryRunner.dropTable('suppliers', true);
    }
  }
}
