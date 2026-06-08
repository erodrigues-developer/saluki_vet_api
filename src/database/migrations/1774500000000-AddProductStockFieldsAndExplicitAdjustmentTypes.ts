import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddProductStockFieldsAndExplicitAdjustmentTypes1774500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const productsTable = await queryRunner.getTable('products');
    if (productsTable && !productsTable.findColumnByName('minimum_stock')) {
      await queryRunner.addColumn(
        'products',
        new TableColumn({
          name: 'minimum_stock',
          type: 'decimal',
          precision: 10,
          scale: 3,
          isNullable: true,
        }),
      );
    }

    if (productsTable && !productsTable.findColumnByName('barcode')) {
      await queryRunner.addColumn(
        'products',
        new TableColumn({
          name: 'barcode',
          type: 'varchar',
          length: '100',
          isNullable: true,
        }),
      );
    }

    if (productsTable && !productsTable.findColumnByName('img_url')) {
      await queryRunner.addColumn(
        'products',
        new TableColumn({
          name: 'img_url',
          type: 'text',
          isNullable: true,
        }),
      );
    }

    await queryRunner.query(`
      UPDATE stock_movements
      SET
        movement_type = CASE
          WHEN quantity < 0 THEN 'ADJUSTMENT_OUT'
          ELSE 'ADJUSTMENT_IN'
        END,
        quantity = ABS(quantity)
      WHERE movement_type = 'ADJUSTMENT'
    `);

    await queryRunner.query(`
      UPDATE stock_locations
      SET name = 'Sala de Vacinas'
      WHERE name = 'Armário Recepção (Vendas)'
    `);
    await queryRunner.query(`
      UPDATE stock_locations
      SET name = 'Farmácia'
      WHERE name = 'Consultório 1'
    `);
    await queryRunner.query(`
      UPDATE stock_locations
      SET name = 'Internação'
      WHERE name = 'Bloco Cirúrgico'
    `);
    await queryRunner.query(`
      UPDATE stock_locations
      SET is_default = CASE WHEN name = 'Estoque Principal' THEN true ELSE is_default END
    `);

    const stockLocationsCount = await queryRunner.query(
      'SELECT COUNT(1)::int AS count FROM stock_locations',
    );

    if (Number(stockLocationsCount?.[0]?.count || 0) === 0) {
      await queryRunner.query(`
        INSERT INTO stock_locations (name, is_default, created_at, updated_at)
        VALUES
          ('Estoque Principal', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
          ('Sala de Vacinas', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
          ('Farmácia', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
          ('Internação', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE stock_movements
      SET
        movement_type = 'ADJUSTMENT',
        quantity = CASE
          WHEN movement_type = 'ADJUSTMENT_OUT' THEN -quantity
          ELSE quantity
        END
      WHERE movement_type IN ('ADJUSTMENT_IN', 'ADJUSTMENT_OUT')
    `);

    const productsTable = await queryRunner.getTable('products');
    if (productsTable?.findColumnByName('img_url')) {
      await queryRunner.dropColumn('products', 'img_url');
    }
    if (productsTable?.findColumnByName('barcode')) {
      await queryRunner.dropColumn('products', 'barcode');
    }
    if (productsTable?.findColumnByName('minimum_stock')) {
      await queryRunner.dropColumn('products', 'minimum_stock');
    }
  }
}
