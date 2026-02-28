import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateStockMovementsTable1720560000011
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('stock_movements');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'stock_movements',
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
            { name: 'movement_type', type: 'varchar', length: '20' },
            { name: 'quantity', type: 'decimal', precision: 10, scale: 3 },
            {
              name: 'unit_cost',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            { name: 'occurred_at', type: 'timestamp' },
            {
              name: 'reference_type',
              type: 'varchar',
              length: '50',
              isNullable: true,
            },
            { name: 'reference_id', type: 'bigint', isNullable: true },
            { name: 'notes', type: 'text', isNullable: true },
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
        }),
        true,
      );

      await queryRunner.createForeignKeys('stock_movements', [
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('stock_movements');
    if (table) {
      await queryRunner.dropForeignKeys('stock_movements', table.foreignKeys);
    }
    await queryRunner.dropTable('stock_movements', true);
  }
}
