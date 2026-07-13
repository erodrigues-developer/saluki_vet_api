import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
  TableUnique,
} from 'typeorm';

export class AddStockExpirationControl1775600000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const productsTable = await queryRunner.getTable('products');
    if (productsTable && !productsTable.findColumnByName('tracks_expiration')) {
      await queryRunner.addColumn(
        'products',
        new TableColumn({
          name: 'tracks_expiration',
          type: 'boolean',
          default: false,
        }),
      );
    }

    const batchesExists = await queryRunner.hasTable('stock_batches');
    if (!batchesExists) {
      await queryRunner.createTable(
        new Table({
          name: 'stock_batches',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'product_id', type: 'bigint' },
            { name: 'stock_location_id', type: 'bigint' },
            { name: 'lot_code', type: 'varchar', length: '100' },
            { name: 'expiration_date', type: 'date' },
            {
              name: 'initial_quantity',
              type: 'decimal',
              precision: 10,
              scale: 3,
              default: 0,
            },
            {
              name: 'remaining_quantity',
              type: 'decimal',
              precision: 10,
              scale: 3,
              default: 0,
            },
            {
              name: 'unit_cost',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
          indices: [
            new TableIndex({
              name: 'IDX_stock_batches_product_location_expiration',
              columnNames: ['product_id', 'stock_location_id', 'expiration_date'],
            }),
            new TableIndex({
              name: 'IDX_stock_batches_location_expiration',
              columnNames: ['stock_location_id', 'expiration_date'],
            }),
          ],
          uniques: [
            new TableUnique({
              name: 'UQ_stock_batches_product_location_lot_expiration',
              columnNames: [
                'product_id',
                'stock_location_id',
                'lot_code',
                'expiration_date',
              ],
            }),
          ],
        }),
      );

      await queryRunner.createForeignKeys('stock_batches', [
        new TableForeignKey({
          columnNames: ['product_id'],
          referencedTableName: 'products',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
        new TableForeignKey({
          columnNames: ['stock_location_id'],
          referencedTableName: 'stock_locations',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      ]);
    }

    const stockMovementsTable = await queryRunner.getTable('stock_movements');
    if (stockMovementsTable && !stockMovementsTable.findColumnByName('stock_batch_id')) {
      await queryRunner.addColumn(
        'stock_movements',
        new TableColumn({
          name: 'stock_batch_id',
          type: 'bigint',
          isNullable: true,
        }),
      );
      await queryRunner.createForeignKey(
        'stock_movements',
        new TableForeignKey({
          columnNames: ['stock_batch_id'],
          referencedTableName: 'stock_batches',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const stockMovementsTable = await queryRunner.getTable('stock_movements');
    const stockBatchFk = stockMovementsTable?.foreignKeys.find((foreignKey) =>
      foreignKey.columnNames.includes('stock_batch_id'),
    );
    if (stockBatchFk) {
      await queryRunner.dropForeignKey('stock_movements', stockBatchFk);
    }
    if (stockMovementsTable?.findColumnByName('stock_batch_id')) {
      await queryRunner.dropColumn('stock_movements', 'stock_batch_id');
    }

    const stockBatchesTable = await queryRunner.getTable('stock_batches');
    if (stockBatchesTable) {
      await queryRunner.dropTable('stock_batches');
    }

    const productsTable = await queryRunner.getTable('products');
    if (productsTable?.findColumnByName('tracks_expiration')) {
      await queryRunner.dropColumn('products', 'tracks_expiration');
    }
  }
}
