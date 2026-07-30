import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWeightedProductSaleFields1776200000000
  implements MigrationInterface
{
  name = 'AddWeightedProductSaleFields1776200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const productsTable = await queryRunner.getTable('products');
    if (!productsTable) return;

    const addColumn = async (column: TableColumn) => {
      if (!productsTable.findColumnByName(column.name)) {
        await queryRunner.addColumn('products', column);
      }
    };

    await addColumn(
      new TableColumn({
        name: 'sale_mode',
        type: 'varchar',
        length: '20',
        default: "'UNIT'",
      }),
    );
    await addColumn(
      new TableColumn({
        name: 'sale_unit',
        type: 'varchar',
        length: '20',
        isNullable: true,
        default: "'un'",
      }),
    );
    await addColumn(
      new TableColumn({
        name: 'scale_barcode_enabled',
        type: 'boolean',
        default: false,
      }),
    );
    await addColumn(
      new TableColumn({
        name: 'scale_barcode_prefix',
        type: 'varchar',
        length: '10',
        isNullable: true,
      }),
    );
    await addColumn(
      new TableColumn({
        name: 'scale_barcode_product_code',
        type: 'varchar',
        length: '20',
        isNullable: true,
      }),
    );
    await addColumn(
      new TableColumn({
        name: 'scale_barcode_type',
        type: 'varchar',
        length: '20',
        isNullable: true,
      }),
    );

    await queryRunner.query(`
      UPDATE products
      SET sale_mode = 'UNIT',
          sale_unit = COALESCE(NULLIF(unit, ''), 'un')
      WHERE sale_mode IS NULL OR sale_unit IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const productsTable = await queryRunner.getTable('products');
    if (!productsTable) return;

    for (const columnName of [
      'scale_barcode_type',
      'scale_barcode_product_code',
      'scale_barcode_prefix',
      'scale_barcode_enabled',
      'sale_unit',
      'sale_mode',
    ]) {
      if (productsTable.findColumnByName(columnName)) {
        await queryRunner.dropColumn('products', columnName);
      }
    }
  }
}
