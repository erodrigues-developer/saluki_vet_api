import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateFinancialTables1720560000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'payment_methods',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
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
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'sales',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'client_id',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'veterinarian_id',
            type: 'bigint',
          },
          {
            name: 'sale_date',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'OPEN'",
          },
          {
            name: 'subtotal',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'discount_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'total_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'notes',
            type: 'text',
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
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'sale_items',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'sale_id',
            type: 'bigint',
          },
          {
            name: 'product_id',
            type: 'bigint',
          },
          {
            name: 'quantity',
            type: 'decimal',
            precision: 10,
            scale: 3,
            default: 1,
          },
          {
            name: 'unit_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'discount_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'total_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'payments',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'sale_id',
            type: 'bigint',
          },
          {
            name: 'payment_method_id',
            type: 'bigint',
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'paid_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'notes',
            type: 'text',
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
      }),
      true,
    );

    // Foreign Keys
    await queryRunner.createForeignKey('sales', new TableForeignKey({
      columnNames: ['client_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'clients',
      onDelete: 'SET NULL',
    }));

    await queryRunner.createForeignKey('sales', new TableForeignKey({
      columnNames: ['veterinarian_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'users',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('sale_items', new TableForeignKey({
      columnNames: ['sale_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'sales',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('sale_items', new TableForeignKey({
      columnNames: ['product_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'products',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('payments', new TableForeignKey({
      columnNames: ['sale_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'sales',
      onDelete: 'CASCADE',
    }));

    await queryRunner.createForeignKey('payments', new TableForeignKey({
      columnNames: ['payment_method_id'],
      referencedColumnNames: ['id'],
      referencedTableName: 'payment_methods',
      onDelete: 'RESTRICT',
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const paymentsTable = await queryRunner.getTable('payments');
    if (paymentsTable) {
      const fks = paymentsTable.foreignKeys;
      await queryRunner.dropForeignKeys('payments', fks);
    }
    await queryRunner.dropTable('payments');

    const saleItemsTable = await queryRunner.getTable('sale_items');
    if (saleItemsTable) {
      const fks = saleItemsTable.foreignKeys;
      await queryRunner.dropForeignKeys('sale_items', fks);
    }
    await queryRunner.dropTable('sale_items');

    const salesTable = await queryRunner.getTable('sales');
    if (salesTable) {
      const fks = salesTable.foreignKeys;
      await queryRunner.dropForeignKeys('sales', fks);
    }
    await queryRunner.dropTable('sales');

    await queryRunner.dropTable('payment_methods');
  }
}
