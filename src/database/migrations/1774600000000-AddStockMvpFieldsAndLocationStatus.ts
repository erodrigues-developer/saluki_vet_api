import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddStockMvpFieldsAndLocationStatus1774600000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const stockLocationsTable = await queryRunner.getTable('stock_locations');
    if (stockLocationsTable && !stockLocationsTable.findColumnByName('is_active')) {
      await queryRunner.addColumn(
        'stock_locations',
        new TableColumn({
          name: 'is_active',
          type: 'boolean',
          default: true,
        }),
      );
    }

    const stockMovementsTable = await queryRunner.getTable('stock_movements');
    if (stockMovementsTable && !stockMovementsTable.findColumnByName('reason')) {
      await queryRunner.addColumn(
        'stock_movements',
        new TableColumn({
          name: 'reason',
          type: 'varchar',
          length: '100',
          isNullable: true,
        }),
      );
    }

    if (
      stockMovementsTable &&
      !stockMovementsTable.findColumnByName('created_by_user_id')
    ) {
      await queryRunner.addColumn(
        'stock_movements',
        new TableColumn({
          name: 'created_by_user_id',
          type: 'bigint',
          isNullable: true,
        }),
      );
      await queryRunner.createForeignKey(
        'stock_movements',
        new TableForeignKey({
          columnNames: ['created_by_user_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }

    const saleItemsTable = await queryRunner.getTable('sale_items');
    if (saleItemsTable && !saleItemsTable.findColumnByName('stock_location_id')) {
      await queryRunner.addColumn(
        'sale_items',
        new TableColumn({
          name: 'stock_location_id',
          type: 'bigint',
          isNullable: true,
        }),
      );
      await queryRunner.createForeignKey(
        'sale_items',
        new TableForeignKey({
          columnNames: ['stock_location_id'],
          referencedTableName: 'stock_locations',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }

    await queryRunner.query(`
      UPDATE stock_locations
      SET is_active = true
      WHERE is_active IS NULL
    `);

    await queryRunner.query(`
      INSERT INTO stock_locations (name, is_default, is_active, created_at, updated_at)
      SELECT 'Centro Cirúrgico', false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      WHERE NOT EXISTS (
        SELECT 1 FROM stock_locations WHERE LOWER(name) = LOWER('Centro Cirúrgico')
      )
    `);

    await queryRunner.query(`
      UPDATE stock_locations
      SET is_default = CASE WHEN LOWER(name) = LOWER('Estoque Principal') THEN true ELSE false END
      WHERE is_default = true
         OR LOWER(name) = LOWER('Estoque Principal')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const saleItemsTable = await queryRunner.getTable('sale_items');
    const saleItemsStockLocationFk = saleItemsTable?.foreignKeys.find((foreignKey) =>
      foreignKey.columnNames.includes('stock_location_id'),
    );
    if (saleItemsStockLocationFk) {
      await queryRunner.dropForeignKey('sale_items', saleItemsStockLocationFk);
    }
    if (saleItemsTable?.findColumnByName('stock_location_id')) {
      await queryRunner.dropColumn('sale_items', 'stock_location_id');
    }

    const stockMovementsTable = await queryRunner.getTable('stock_movements');
    const createdByUserFk = stockMovementsTable?.foreignKeys.find((foreignKey) =>
      foreignKey.columnNames.includes('created_by_user_id'),
    );
    if (createdByUserFk) {
      await queryRunner.dropForeignKey('stock_movements', createdByUserFk);
    }
    if (stockMovementsTable?.findColumnByName('created_by_user_id')) {
      await queryRunner.dropColumn('stock_movements', 'created_by_user_id');
    }
    if (stockMovementsTable?.findColumnByName('reason')) {
      await queryRunner.dropColumn('stock_movements', 'reason');
    }

    const stockLocationsTable = await queryRunner.getTable('stock_locations');
    if (stockLocationsTable?.findColumnByName('is_active')) {
      await queryRunner.dropColumn('stock_locations', 'is_active');
    }
  }
}
