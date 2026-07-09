import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class UpdateAccountsReceivableOperationalFields1773030000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('accounts_receivable');
    if (!hasTable) {
      return;
    }

    const columnsToAdd: TableColumn[] = [];

    if (!(await queryRunner.hasColumn('accounts_receivable', 'payment_method_id'))) {
      columnsToAdd.push(
        new TableColumn({
          name: 'payment_method_id',
          type: 'bigint',
          isNullable: true,
        }),
      );
    }

    if (!(await queryRunner.hasColumn('accounts_receivable', 'paid_amount'))) {
      columnsToAdd.push(
        new TableColumn({
          name: 'paid_amount',
          type: 'decimal',
          precision: 10,
          scale: 2,
          isNullable: true,
        }),
      );
    }

    if (!(await queryRunner.hasColumn('accounts_receivable', 'origin_type'))) {
      columnsToAdd.push(
        new TableColumn({
          name: 'origin_type',
          type: 'varchar',
          length: '20',
          default: "'MANUAL'",
        }),
      );
    }

    if (!(await queryRunner.hasColumn('accounts_receivable', 'notes'))) {
      columnsToAdd.push(
        new TableColumn({
          name: 'notes',
          type: 'text',
          isNullable: true,
        }),
      );
    }

    if (!(await queryRunner.hasColumn('accounts_receivable', 'document_url'))) {
      columnsToAdd.push(
        new TableColumn({
          name: 'document_url',
          type: 'varchar',
          length: '500',
          isNullable: true,
        }),
      );
    }

    if (columnsToAdd.length) {
      await queryRunner.addColumns('accounts_receivable', columnsToAdd);
    }

    let table = await queryRunner.getTable('accounts_receivable');
    if (!table) {
      return;
    }

    const paymentMethodFk = table.foreignKeys.find(
      (fk) => fk.name === 'FK_accounts_receivable_payment_method_id',
    );

    if (!paymentMethodFk) {
      await queryRunner.createForeignKey(
        'accounts_receivable',
        new TableForeignKey({
          name: 'FK_accounts_receivable_payment_method_id',
          columnNames: ['payment_method_id'],
          referencedTableName: 'payment_methods',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }

    table = await queryRunner.getTable('accounts_receivable');
    if (!table) {
      return;
    }

    const indexes = table.indices.map((index) => index.name);

    if (!indexes.includes('IDX_accounts_receivable_status_due_date')) {
      await queryRunner.createIndex(
        'accounts_receivable',
        new TableIndex({
          name: 'IDX_accounts_receivable_status_due_date',
          columnNames: ['status', 'due_date'],
        }),
      );
    }

    if (!indexes.includes('IDX_accounts_receivable_client_due_date')) {
      await queryRunner.createIndex(
        'accounts_receivable',
        new TableIndex({
          name: 'IDX_accounts_receivable_client_due_date',
          columnNames: ['client_id', 'due_date'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('accounts_receivable');
    if (!hasTable) {
      return;
    }

    const table = await queryRunner.getTable('accounts_receivable');
    if (!table) {
      return;
    }

    const statusIndex = table.indices.find(
      (index) => index.name === 'IDX_accounts_receivable_status_due_date',
    );
    if (statusIndex) {
      await queryRunner.dropIndex('accounts_receivable', statusIndex);
    }

    const clientIndex = table.indices.find(
      (index) => index.name === 'IDX_accounts_receivable_client_due_date',
    );
    if (clientIndex) {
      await queryRunner.dropIndex('accounts_receivable', clientIndex);
    }

    const paymentMethodFk = table.foreignKeys.find(
      (fk) => fk.name === 'FK_accounts_receivable_payment_method_id',
    );
    if (paymentMethodFk) {
      await queryRunner.dropForeignKey('accounts_receivable', paymentMethodFk);
    }

    const columnsToDrop = [
      'document_url',
      'notes',
      'origin_type',
      'paid_amount',
      'payment_method_id',
    ];

    for (const columnName of columnsToDrop) {
      if (await queryRunner.hasColumn('accounts_receivable', columnName)) {
        await queryRunner.dropColumn('accounts_receivable', columnName);
      }
    }
  }
}
