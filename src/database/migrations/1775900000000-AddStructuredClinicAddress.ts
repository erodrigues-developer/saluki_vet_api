import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddStructuredClinicAddress1775900000000
  implements MigrationInterface
{
  name = 'AddStructuredClinicAddress1775900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('clinic_settings');
    if (!table) return;

    const addIfMissing = async (column: TableColumn) => {
      if (!table.findColumnByName(column.name)) {
        await queryRunner.addColumn('clinic_settings', column);
      }
    };

    await addIfMissing(new TableColumn({ name: 'street', type: 'varchar', length: '255', isNullable: true }));
    await addIfMissing(new TableColumn({ name: 'number', type: 'varchar', length: '50', isNullable: true }));
    await addIfMissing(new TableColumn({ name: 'district', type: 'varchar', length: '255', isNullable: true }));
    await addIfMissing(new TableColumn({ name: 'complement', type: 'varchar', length: '255', isNullable: true }));
    await addIfMissing(new TableColumn({ name: 'zip_code', type: 'varchar', length: '20', isNullable: true }));
    await addIfMissing(new TableColumn({ name: 'city', type: 'varchar', length: '255', isNullable: true }));
    await addIfMissing(new TableColumn({ name: 'state', type: 'varchar', length: '50', isNullable: true }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('clinic_settings');
    if (!table) return;

    const dropIfExists = async (columnName: string) => {
      if (table.findColumnByName(columnName)) {
        await queryRunner.dropColumn('clinic_settings', columnName);
      }
    };

    await dropIfExists('state');
    await dropIfExists('city');
    await dropIfExists('zip_code');
    await dropIfExists('complement');
    await dropIfExists('district');
    await dropIfExists('number');
    await dropIfExists('street');
  }
}
