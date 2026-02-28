import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateTreatmentMapTable1720560000017
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('treatment_map');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'treatment_map',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'inpatient_record_id', type: 'bigint' },
            { name: 'scheduled_at', type: 'timestamp' },
            { name: 'executed_at', type: 'timestamp', isNullable: true },
            { name: 'medicament_id', type: 'bigint', isNullable: true },
            { name: 'procedure_id', type: 'bigint', isNullable: true },
            { name: 'dose', type: 'varchar', length: '100', isNullable: true },
            {
              name: 'status',
              type: 'varchar',
              length: '20',
              default: "'PENDING'",
            },
            { name: 'executed_by_user_id', type: 'bigint', isNullable: true },
            { name: 'notes', type: 'text', isNullable: true },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKeys('treatment_map', [
        new TableForeignKey({
          columnNames: ['inpatient_record_id'],
          referencedTableName: 'inpatient_records',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
        new TableForeignKey({
          columnNames: ['medicament_id'],
          referencedTableName: 'products',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
        new TableForeignKey({
          columnNames: ['procedure_id'],
          referencedTableName: 'procedures',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
        new TableForeignKey({
          columnNames: ['executed_by_user_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('treatment_map');
    if (table) {
      await queryRunner.dropForeignKeys('treatment_map', table.foreignKeys);
    }
    await queryRunner.dropTable('treatment_map', true);
  }
}
