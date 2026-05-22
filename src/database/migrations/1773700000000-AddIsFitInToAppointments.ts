import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsFitInToAppointments1773700000000
  implements MigrationInterface
{
  name = 'AddIsFitInToAppointments1773700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'appointments',
      new TableColumn({
        name: 'is_fit_in',
        type: 'boolean',
        default: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('appointments', 'is_fit_in');
  }
}
