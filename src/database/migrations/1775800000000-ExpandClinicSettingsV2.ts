import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ExpandClinicSettingsV21775800000000
  implements MigrationInterface
{
  name = 'ExpandClinicSettingsV21775800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('clinic_settings');
    if (!table) return;

    const addIfMissing = async (column: TableColumn) => {
      if (!table.findColumnByName(column.name)) {
        await queryRunner.addColumn('clinic_settings', column);
      }
    };

    await addIfMissing(
      new TableColumn({
        name: 'name',
        type: 'varchar',
        length: '200',
        isNullable: false,
        default: "'Minha Clínica'",
      }),
    );
    await addIfMissing(new TableColumn({ name: 'short_name', type: 'varchar', length: '100', isNullable: true }));
    await addIfMissing(new TableColumn({ name: 'address', type: 'text', isNullable: true }));
    await addIfMissing(new TableColumn({ name: 'street', type: 'varchar', length: '255', isNullable: true }));
    await addIfMissing(new TableColumn({ name: 'number', type: 'varchar', length: '50', isNullable: true }));
    await addIfMissing(new TableColumn({ name: 'district', type: 'varchar', length: '255', isNullable: true }));
    await addIfMissing(new TableColumn({ name: 'complement', type: 'varchar', length: '255', isNullable: true }));
    await addIfMissing(new TableColumn({ name: 'zip_code', type: 'varchar', length: '20', isNullable: true }));
    await addIfMissing(new TableColumn({ name: 'city', type: 'varchar', length: '255', isNullable: true }));
    await addIfMissing(new TableColumn({ name: 'state', type: 'varchar', length: '50', isNullable: true }));
    await addIfMissing(new TableColumn({ name: 'cnpj', type: 'varchar', length: '18', isNullable: true }));
    await addIfMissing(new TableColumn({ name: 'phone', type: 'varchar', length: '30', isNullable: true }));
    await addIfMissing(new TableColumn({ name: 'whatsapp', type: 'varchar', length: '30', isNullable: true }));
    await addIfMissing(new TableColumn({ name: 'email', type: 'varchar', length: '200', isNullable: true }));
    await addIfMissing(new TableColumn({ name: 'login_image_url', type: 'text', isNullable: true }));
    await addIfMissing(new TableColumn({ name: 'primary_color', type: 'varchar', length: '7', isNullable: true }));
    await addIfMissing(new TableColumn({ name: 'secondary_color', type: 'varchar', length: '7', isNullable: true }));
    await addIfMissing(new TableColumn({ name: 'login_message', type: 'text', isNullable: true }));
    await addIfMissing(
      new TableColumn({
        name: 'technical_responsible_name',
        type: 'varchar',
        length: '200',
        isNullable: true,
      }),
    );
    await addIfMissing(
      new TableColumn({
        name: 'technical_responsible_crmv',
        type: 'varchar',
        length: '30',
        isNullable: true,
      }),
    );
    await addIfMissing(
      new TableColumn({
        name: 'technical_responsible_crmv_uf',
        type: 'varchar',
        length: '2',
        isNullable: true,
      }),
    );

    const logoColumn = table.findColumnByName('logo_url');
    if (logoColumn && logoColumn.type !== 'text') {
      await queryRunner.changeColumn(
        'clinic_settings',
        'logo_url',
        new TableColumn({
          name: 'logo_url',
          type: 'text',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('clinic_settings');
    if (!table) return;

    const dropIfExists = async (columnName: string) => {
      if (table.findColumnByName(columnName)) {
        await queryRunner.dropColumn('clinic_settings', columnName);
      }
    };

    await dropIfExists('technical_responsible_crmv_uf');
    await dropIfExists('technical_responsible_crmv');
    await dropIfExists('technical_responsible_name');
    await dropIfExists('login_message');
    await dropIfExists('secondary_color');
    await dropIfExists('primary_color');
    await dropIfExists('login_image_url');
    await dropIfExists('email');
    await dropIfExists('whatsapp');
    await dropIfExists('phone');
    await dropIfExists('cnpj');
    await dropIfExists('state');
    await dropIfExists('city');
    await dropIfExists('zip_code');
    await dropIfExists('complement');
    await dropIfExists('district');
    await dropIfExists('number');
    await dropIfExists('street');
    await dropIfExists('address');
    await dropIfExists('short_name');
    await dropIfExists('name');

    const logoColumn = table.findColumnByName('logo_url');
    if (logoColumn && logoColumn.type !== 'varchar') {
      await queryRunner.changeColumn(
        'clinic_settings',
        'logo_url',
        new TableColumn({
          name: 'logo_url',
          type: 'varchar',
          length: '500',
          isNullable: true,
        }),
      );
    }
  }
}
