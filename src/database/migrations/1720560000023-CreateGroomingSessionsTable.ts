import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateGroomingSessionsTable1720560000023
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('grooming_sessions');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'grooming_sessions',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'pet_id', type: 'bigint' },
            { name: 'groomer_id', type: 'bigint', isNullable: true },
            { name: 'package_id', type: 'bigint', isNullable: true },
            { name: 'scheduled_at', type: 'timestamp' },
            { name: 'started_at', type: 'timestamp', isNullable: true },
            { name: 'finished_at', type: 'timestamp', isNullable: true },
            {
              name: 'status',
              type: 'varchar',
              length: '20',
              default: "'SCHEDULED'",
            },
            { name: 'service_notes', type: 'text', isNullable: true },
            { name: 'checklist_json', type: 'text', isNullable: true },
            {
              name: 'total_amount',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKeys('grooming_sessions', [
        new TableForeignKey({
          columnNames: ['pet_id'],
          referencedTableName: 'pets',
          referencedColumnNames: ['id'],
        }),
        new TableForeignKey({
          columnNames: ['groomer_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
        new TableForeignKey({
          columnNames: ['package_id'],
          referencedTableName: 'grooming_packages',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('grooming_sessions');
    if (table) {
      await queryRunner.dropForeignKeys('grooming_sessions', table.foreignKeys);
    }
    await queryRunner.dropTable('grooming_sessions', true);
  }
}
