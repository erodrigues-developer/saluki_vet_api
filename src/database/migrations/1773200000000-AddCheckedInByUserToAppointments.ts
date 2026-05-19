import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddCheckedInByUserToAppointments1773200000000
  implements MigrationInterface
{
  name = 'AddCheckedInByUserToAppointments1773200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const appointments = await queryRunner.getTable('appointments');
    if (!appointments) return;

    if (!appointments.findColumnByName('checked_in_by_user_id')) {
      await queryRunner.addColumn(
        'appointments',
        new TableColumn({
          name: 'checked_in_by_user_id',
          type: 'bigint',
          isNullable: true,
        }),
      );
    }

    const refreshed = await queryRunner.getTable('appointments');
    if (!refreshed) return;

    const hasFk = refreshed.foreignKeys.some(
      (fk) => fk.name === 'fk_appointments_checked_in_by_user',
    );

    if (!hasFk) {
      await queryRunner.createForeignKey(
        'appointments',
        new TableForeignKey({
          name: 'fk_appointments_checked_in_by_user',
          columnNames: ['checked_in_by_user_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const appointments = await queryRunner.getTable('appointments');
    if (!appointments) return;

    const fk = appointments.foreignKeys.find(
      (item) => item.name === 'fk_appointments_checked_in_by_user',
    );
    if (fk) {
      await queryRunner.dropForeignKey('appointments', fk);
    }

    if (appointments.findColumnByName('checked_in_by_user_id')) {
      await queryRunner.dropColumn('appointments', 'checked_in_by_user_id');
    }
  }
}
