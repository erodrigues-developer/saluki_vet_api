import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCheckInToleranceToClinicSettings1773400000000
  implements MigrationInterface
{
  name = 'AddCheckInToleranceToClinicSettings1773400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('clinic_settings');
    if (!table) return;

    if (!table.findColumnByName('check_in_tolerance_minutes')) {
      await queryRunner.addColumn(
        'clinic_settings',
        new TableColumn({
          name: 'check_in_tolerance_minutes',
          type: 'int',
          isNullable: false,
          default: '10',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('clinic_settings');
    if (!table) return;

    if (table.findColumnByName('check_in_tolerance_minutes')) {
      await queryRunner.dropColumn(
        'clinic_settings',
        'check_in_tolerance_minutes',
      );
    }
  }
}
