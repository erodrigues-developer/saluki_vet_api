import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class EnhanceSalesAndCommissions1772250000003
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (
      (await queryRunner.hasTable('procedures')) &&
      !(await queryRunner.hasColumn('procedures', 'commission_percent'))
    ) {
      await queryRunner.addColumn(
        'procedures',
        new TableColumn({
          name: 'commission_percent',
          type: 'decimal',
          precision: 5,
          scale: 2,
          default: 0,
        }),
      );
    }

    if (await queryRunner.hasTable('sale_items')) {
      const saleItemsTable = await queryRunner.getTable('sale_items');
      const productIdColumn = saleItemsTable?.findColumnByName('product_id');

      if (productIdColumn && !productIdColumn.isNullable) {
        await queryRunner.changeColumn(
          'sale_items',
          'product_id',
          new TableColumn({
            ...productIdColumn,
            isNullable: true,
          }),
        );
      }

      if (!(await queryRunner.hasColumn('sale_items', 'procedure_id'))) {
        await queryRunner.addColumn(
          'sale_items',
          new TableColumn({
            name: 'procedure_id',
            type: 'bigint',
            isNullable: true,
          }),
        );
      }

      const refreshedSaleItemsTable = await queryRunner.getTable('sale_items');
      const hasProcedureForeignKey = refreshedSaleItemsTable?.foreignKeys.some(
        (foreignKey) =>
          foreignKey.columnNames.length === 1 &&
          foreignKey.columnNames[0] === 'procedure_id',
      );

      if (!hasProcedureForeignKey) {
        await queryRunner.createForeignKey(
          'sale_items',
          new TableForeignKey({
            columnNames: ['procedure_id'],
            referencedTableName: 'procedures',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          }),
        );
      }

      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'chk_sale_items_product_or_procedure'
          ) THEN
            ALTER TABLE sale_items
            ADD CONSTRAINT chk_sale_items_product_or_procedure
            CHECK (
              (CASE WHEN product_id IS NULL THEN 0 ELSE 1 END) +
              (CASE WHEN procedure_id IS NULL THEN 0 ELSE 1 END) = 1
            );
          END IF;
        END
        $$;
      `);
    }

    if (await queryRunner.hasTable('commissions')) {
      if (!(await queryRunner.hasColumn('commissions', 'procedure_id'))) {
        await queryRunner.addColumn(
          'commissions',
          new TableColumn({
            name: 'procedure_id',
            type: 'bigint',
            isNullable: true,
          }),
        );
      }

      if (!(await queryRunner.hasColumn('commissions', 'base_amount'))) {
        await queryRunner.addColumn(
          'commissions',
          new TableColumn({
            name: 'base_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          }),
        );
      }

      if (!(await queryRunner.hasColumn('commissions', 'rate_percent'))) {
        await queryRunner.addColumn(
          'commissions',
          new TableColumn({
            name: 'rate_percent',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          }),
        );
      }

      const commissionsTable = await queryRunner.getTable('commissions');
      const hasProcedureForeignKey = commissionsTable?.foreignKeys.some(
        (foreignKey) =>
          foreignKey.columnNames.length === 1 &&
          foreignKey.columnNames[0] === 'procedure_id',
      );

      if (!hasProcedureForeignKey) {
        await queryRunner.createForeignKey(
          'commissions',
          new TableForeignKey({
            columnNames: ['procedure_id'],
            referencedTableName: 'procedures',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          }),
        );
      }

      await queryRunner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "uq_commissions_sale_procedure_not_null"
        ON "commissions" ("sale_id", "procedure_id")
        WHERE "sale_id" IS NOT NULL AND "procedure_id" IS NOT NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('commissions')) {
      await queryRunner.query(`
        DROP INDEX IF EXISTS "uq_commissions_sale_procedure_not_null"
      `);

      const commissionsTable = await queryRunner.getTable('commissions');
      const procedureForeignKey = commissionsTable?.foreignKeys.find(
        (foreignKey) =>
          foreignKey.columnNames.length === 1 &&
          foreignKey.columnNames[0] === 'procedure_id',
      );

      if (procedureForeignKey) {
        await queryRunner.dropForeignKey('commissions', procedureForeignKey);
      }

      if (await queryRunner.hasColumn('commissions', 'rate_percent')) {
        await queryRunner.dropColumn('commissions', 'rate_percent');
      }

      if (await queryRunner.hasColumn('commissions', 'base_amount')) {
        await queryRunner.dropColumn('commissions', 'base_amount');
      }

      if (await queryRunner.hasColumn('commissions', 'procedure_id')) {
        await queryRunner.dropColumn('commissions', 'procedure_id');
      }
    }

    if (await queryRunner.hasTable('sale_items')) {
      await queryRunner.query(`
        ALTER TABLE sale_items
        DROP CONSTRAINT IF EXISTS chk_sale_items_product_or_procedure
      `);

      const saleItemsTable = await queryRunner.getTable('sale_items');
      const procedureForeignKey = saleItemsTable?.foreignKeys.find(
        (foreignKey) =>
          foreignKey.columnNames.length === 1 &&
          foreignKey.columnNames[0] === 'procedure_id',
      );

      if (procedureForeignKey) {
        await queryRunner.dropForeignKey('sale_items', procedureForeignKey);
      }

      if (await queryRunner.hasColumn('sale_items', 'procedure_id')) {
        await queryRunner.dropColumn('sale_items', 'procedure_id');
      }

      const refreshedSaleItemsTable = await queryRunner.getTable('sale_items');
      const productIdColumn = refreshedSaleItemsTable?.findColumnByName(
        'product_id',
      );

      if (productIdColumn && productIdColumn.isNullable) {
        await queryRunner.changeColumn(
          'sale_items',
          'product_id',
          new TableColumn({
            ...productIdColumn,
            isNullable: false,
          }),
        );
      }
    }

    if (
      (await queryRunner.hasTable('procedures')) &&
      (await queryRunner.hasColumn('procedures', 'commission_percent'))
    ) {
      await queryRunner.dropColumn('procedures', 'commission_percent');
    }
  }
}
