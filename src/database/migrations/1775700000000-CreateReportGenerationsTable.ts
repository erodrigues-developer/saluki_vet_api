import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateReportGenerationsTable1775700000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable('report_generations');
    if (exists) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'report_generations',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'report_type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'requested_by_user_id',
            type: 'bigint',
          },
          {
            name: 'filters_json',
            type: 'jsonb',
          },
          {
            name: 'file_url',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'storage_key',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'original_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'mime_type',
            type: 'varchar',
            length: '120',
          },
          {
            name: 'file_size',
            type: 'bigint',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'GENERATED'",
          },
          {
            name: 'row_count',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'generation_time_ms',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'generated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
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

    await queryRunner.createForeignKey(
      'report_generations',
      new TableForeignKey({
        columnNames: ['requested_by_user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_report_generations_user_generated_at"
      ON "report_generations" ("requested_by_user_id", "generated_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_report_generations_type_generated_at"
      ON "report_generations" ("report_type", "generated_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('report_generations');
    if (table) {
      const userForeignKey = table.foreignKeys.find((foreignKey) =>
        foreignKey.columnNames.includes('requested_by_user_id'),
      );

      if (userForeignKey) {
        await queryRunner.dropForeignKey('report_generations', userForeignKey);
      }
    }

    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_report_generations_user_generated_at"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_report_generations_type_generated_at"',
    );
    await queryRunner.dropTable('report_generations', true);
  }
}
