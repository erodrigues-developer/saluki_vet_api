import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateAccountsPayableAddPaymentColumns1772249670366
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const accountsPayableExists =
      await queryRunner.hasTable('accounts_payable');
    if (!accountsPayableExists) {
      return;
    }

    const columnsToAdd: TableColumn[] = [];

    if (!(await queryRunner.hasColumn('accounts_payable', 'supplier_name'))) {
      columnsToAdd.push(
        new TableColumn({
          name: 'supplier_name',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }

    if (!(await queryRunner.hasColumn('accounts_payable', 'paid_amount'))) {
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

    if (!(await queryRunner.hasColumn('accounts_payable', 'payment_method'))) {
      columnsToAdd.push(
        new TableColumn({
          name: 'payment_method',
          type: 'varchar',
          length: '50',
          isNullable: true,
        }),
      );
    }

    if (!(await queryRunner.hasColumn('accounts_payable', 'document_url'))) {
      columnsToAdd.push(
        new TableColumn({
          name: 'document_url',
          type: 'varchar',
          length: '500',
          isNullable: true,
        }),
      );
    }

    if (columnsToAdd.length > 0) {
      await queryRunner.addColumns('accounts_payable', columnsToAdd);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const accountsPayableExists =
      await queryRunner.hasTable('accounts_payable');
    if (!accountsPayableExists) {
      return;
    }

    const columnsToDrop: string[] = [];

    if (await queryRunner.hasColumn('accounts_payable', 'document_url')) {
      columnsToDrop.push('document_url');
    }
    if (await queryRunner.hasColumn('accounts_payable', 'payment_method')) {
      columnsToDrop.push('payment_method');
    }
    if (await queryRunner.hasColumn('accounts_payable', 'paid_amount')) {
      columnsToDrop.push('paid_amount');
    }
    if (await queryRunner.hasColumn('accounts_payable', 'supplier_name')) {
      columnsToDrop.push('supplier_name');
    }

    if (columnsToDrop.length > 0) {
      await queryRunner.dropColumns('accounts_payable', columnsToDrop);
    }
  }
}
