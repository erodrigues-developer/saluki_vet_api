import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateCashRegistersAndThermalPrinting1776000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'thermal_printers',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'name', type: 'varchar', length: '100' },
          { name: 'code', type: 'varchar', length: '50', isUnique: true },
          { name: 'connection_type', type: 'varchar', length: '20' },
          { name: 'target', type: 'varchar', length: '255' },
          { name: 'paper_width_mm', type: 'int', default: 80 },
          { name: 'columns', type: 'int', default: 48 },
          { name: 'supports_qr_code', type: 'boolean', default: true },
          { name: 'is_active', type: 'boolean', default: true },
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
        name: 'cash_register_terminals',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'name', type: 'varchar', length: '100' },
          { name: 'code', type: 'varchar', length: '50', isUnique: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'default_printer_id', type: 'bigint', isNullable: true },
          { name: 'is_active', type: 'boolean', default: true },
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

    await queryRunner.createForeignKey(
      'cash_register_terminals',
      new TableForeignKey({
        columnNames: ['default_printer_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'thermal_printers',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'cash_register_sessions',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'terminal_id', type: 'bigint' },
          { name: 'opened_by_user_id', type: 'bigint' },
          { name: 'closed_by_user_id', type: 'bigint', isNullable: true },
          { name: 'status', type: 'varchar', length: '20', default: "'OPEN'" },
          { name: 'opened_at', type: 'timestamp' },
          { name: 'closed_at', type: 'timestamp', isNullable: true },
          {
            name: 'opening_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'expected_cash_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'declared_cash_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'cash_difference',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'closing_notes', type: 'text', isNullable: true },
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

    await queryRunner.createForeignKeys('cash_register_sessions', [
      new TableForeignKey({
        columnNames: ['terminal_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'cash_register_terminals',
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        columnNames: ['opened_by_user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        columnNames: ['closed_by_user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    ]);

    await queryRunner.createIndex(
      'cash_register_sessions',
      new TableIndex({
        name: 'idx_cash_register_sessions_terminal',
        columnNames: ['terminal_id'],
      }),
    );
    await queryRunner.createIndex(
      'cash_register_sessions',
      new TableIndex({
        name: 'idx_cash_register_sessions_status',
        columnNames: ['status'],
      }),
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX ux_cash_register_sessions_open_terminal ON cash_register_sessions (terminal_id) WHERE status = 'OPEN'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX ux_cash_register_sessions_open_operator ON cash_register_sessions (opened_by_user_id) WHERE status = 'OPEN'`,
    );

    await queryRunner.createTable(
      new Table({
        name: 'cash_register_movements',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'session_id', type: 'bigint' },
          { name: 'terminal_id', type: 'bigint' },
          { name: 'type', type: 'varchar', length: '30' },
          { name: 'direction', type: 'varchar', length: '10' },
          { name: 'amount', type: 'decimal', precision: 10, scale: 2 },
          { name: 'payment_method_id', type: 'bigint', isNullable: true },
          { name: 'sale_id', type: 'bigint', isNullable: true },
          { name: 'payment_id', type: 'bigint', isNullable: true },
          { name: 'created_by_user_id', type: 'bigint' },
          { name: 'occurred_at', type: 'timestamp' },
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

    await queryRunner.createForeignKeys('cash_register_movements', [
      new TableForeignKey({
        columnNames: ['session_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'cash_register_sessions',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['terminal_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'cash_register_terminals',
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        columnNames: ['payment_method_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'payment_methods',
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        columnNames: ['sale_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'sales',
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        columnNames: ['payment_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'payments',
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        columnNames: ['created_by_user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: 'print_jobs',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'printer_id', type: 'bigint', isNullable: true },
          { name: 'terminal_id', type: 'bigint', isNullable: true },
          {
            name: 'cash_register_session_id',
            type: 'bigint',
            isNullable: true,
          },
          { name: 'sale_id', type: 'bigint', isNullable: true },
          { name: 'fiscal_document_id', type: 'bigint', isNullable: true },
          { name: 'type', type: 'varchar', length: '30' },
          { name: 'status', type: 'varchar', length: '20', default: "'PENDING'" },
          { name: 'copies', type: 'int', default: 1 },
          { name: 'payload_json', type: 'jsonb' },
          { name: 'rendered_content', type: 'text', isNullable: true },
          { name: 'error_message', type: 'text', isNullable: true },
          { name: 'requested_by_user_id', type: 'bigint' },
          { name: 'printed_at', type: 'timestamp', isNullable: true },
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

    await queryRunner.createForeignKeys('print_jobs', [
      new TableForeignKey({
        columnNames: ['printer_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'thermal_printers',
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        columnNames: ['terminal_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'cash_register_terminals',
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        columnNames: ['cash_register_session_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'cash_register_sessions',
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        columnNames: ['sale_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'sales',
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        columnNames: ['requested_by_user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'RESTRICT',
      }),
    ]);

    await queryRunner.addColumn(
      'sales',
      new TableColumn({
        name: 'cash_register_session_id',
        type: 'bigint',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      'payments',
      new TableColumn({
        name: 'cash_register_session_id',
        type: 'bigint',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'sales',
      new TableForeignKey({
        columnNames: ['cash_register_session_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'cash_register_sessions',
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'payments',
      new TableForeignKey({
        columnNames: ['cash_register_session_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'cash_register_sessions',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const paymentsTable = await queryRunner.getTable('payments');
    const paymentsSessionFk = paymentsTable?.foreignKeys.find((fk) =>
      fk.columnNames.includes('cash_register_session_id'),
    );
    if (paymentsSessionFk) {
      await queryRunner.dropForeignKey('payments', paymentsSessionFk);
    }

    const salesTable = await queryRunner.getTable('sales');
    const salesSessionFk = salesTable?.foreignKeys.find((fk) =>
      fk.columnNames.includes('cash_register_session_id'),
    );
    if (salesSessionFk) {
      await queryRunner.dropForeignKey('sales', salesSessionFk);
    }

    await queryRunner.dropColumn('payments', 'cash_register_session_id');
    await queryRunner.dropColumn('sales', 'cash_register_session_id');
    await queryRunner.dropTable('print_jobs', true);
    await queryRunner.dropTable('cash_register_movements', true);
    await queryRunner.query(
      `DROP INDEX IF EXISTS ux_cash_register_sessions_open_terminal`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS ux_cash_register_sessions_open_operator`,
    );
    await queryRunner.dropTable('cash_register_sessions', true);
    await queryRunner.dropTable('cash_register_terminals', true);
    await queryRunner.dropTable('thermal_printers', true);
  }
}
