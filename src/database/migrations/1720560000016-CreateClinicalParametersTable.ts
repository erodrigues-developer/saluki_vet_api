import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateClinicalParametersTable1720560000016
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('clinical_parameters');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'clinical_parameters',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'inpatient_record_id', type: 'bigint' },
            { name: 'measured_at', type: 'timestamp' },
            {
              name: 'temperature_c',
              type: 'decimal',
              precision: 5,
              scale: 2,
              isNullable: true,
            },
            { name: 'heart_rate_bpm', type: 'int', isNullable: true },
            { name: 'respiratory_rate_mpm', type: 'int', isNullable: true },
            {
              name: 'blood_pressure',
              type: 'varchar',
              length: '50',
              isNullable: true,
            },
            {
              name: 'weight_kg',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            { name: 'notes', type: 'text', isNullable: true },
            { name: 'created_by_user_id', type: 'bigint', isNullable: true },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKeys('clinical_parameters', [
        new TableForeignKey({
          columnNames: ['inpatient_record_id'],
          referencedTableName: 'inpatient_records',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
        new TableForeignKey({
          columnNames: ['created_by_user_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('clinical_parameters');
    if (table) {
      await queryRunner.dropForeignKeys(
        'clinical_parameters',
        table.foreignKeys,
      );
    }
    await queryRunner.dropTable('clinical_parameters', true);
  }
}
