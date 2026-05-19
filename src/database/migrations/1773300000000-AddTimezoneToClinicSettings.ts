import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTimezoneToClinicSettings1773300000000
  implements MigrationInterface
{
  name = 'AddTimezoneToClinicSettings1773300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('clinic_settings');
    if (!table) return;

    if (!table.findColumnByName('timezone')) {
      await queryRunner.addColumn(
        'clinic_settings',
        new TableColumn({
          name: 'timezone',
          type: 'varchar',
          length: '100',
          isNullable: false,
          default: "'America/Sao_Paulo'",
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('clinic_settings');
    if (!table) return;

    if (table.findColumnByName('timezone')) {
      await queryRunner.dropColumn('clinic_settings', 'timezone');
    }
  }
}
