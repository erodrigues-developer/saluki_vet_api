import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateInpatientRecordsTable1720560000015
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('inpatient_records');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'inpatient_records',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'pet_id', type: 'bigint' },
            { name: 'box_id', type: 'bigint' },
            { name: 'consultation_id', type: 'bigint', isNullable: true },
            { name: 'reason', type: 'text', isNullable: true },
            { name: 'admission_at', type: 'timestamp' },
            { name: 'discharge_at', type: 'timestamp', isNullable: true },
            {
              name: 'status',
              type: 'varchar',
              length: '20',
              default: "'ACTIVE'",
            },
            { name: 'notes', type: 'text', isNullable: true },
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
        true,
      );

      await queryRunner.createForeignKeys('inpatient_records', [
        new TableForeignKey({
          columnNames: ['pet_id'],
          referencedTableName: 'pets',
          referencedColumnNames: ['id'],
        }),
        new TableForeignKey({
          columnNames: ['box_id'],
          referencedTableName: 'boxes',
          referencedColumnNames: ['id'],
        }),
        new TableForeignKey({
          columnNames: ['consultation_id'],
          referencedTableName: 'consultations',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inpatient_records');
    if (table) {
      await queryRunner.dropForeignKeys('inpatient_records', table.foreignKeys);
    }
    await queryRunner.dropTable('inpatient_records', true);
  }
}
