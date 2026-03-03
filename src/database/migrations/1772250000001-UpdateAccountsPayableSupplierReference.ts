import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class UpdateAccountsPayableSupplierReference1772250000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const accountsPayableExists = await queryRunner.hasTable('accounts_payable');
    if (!accountsPayableExists) {
      return;
    }

    const suppliersExists = await queryRunner.hasTable('suppliers');
    if (!suppliersExists) {
      return;
    }

    let accountsPayableTable = await queryRunner.getTable('accounts_payable');
    if (!accountsPayableTable) {
      return;
    }

    if (!accountsPayableTable.findColumnByName('supplier_id')) {
      await queryRunner.addColumn(
        'accounts_payable',
        new TableColumn({
          name: 'supplier_id',
          type: 'bigint',
          isNullable: true,
        }),
      );

      accountsPayableTable = await queryRunner.getTable('accounts_payable');
    }

    if (!accountsPayableTable) {
      return;
    }

    const hasSupplierFk = accountsPayableTable.foreignKeys.some(
      (fk) => fk.name === 'FK_accounts_payable_supplier_id',
    );

    if (!hasSupplierFk) {
      await queryRunner.createForeignKey(
        'accounts_payable',
        new TableForeignKey({
          name: 'FK_accounts_payable_supplier_id',
          columnNames: ['supplier_id'],
          referencedTableName: 'suppliers',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          onUpdate: 'NO ACTION',
        }),
      );
    }

    accountsPayableTable = await queryRunner.getTable('accounts_payable');

    if (accountsPayableTable?.findColumnByName('supplier_name')) {
      await queryRunner.dropColumn('accounts_payable', 'supplier_name');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const accountsPayableExists = await queryRunner.hasTable('accounts_payable');
    if (!accountsPayableExists) {
      return;
    }

    let accountsPayableTable = await queryRunner.getTable('accounts_payable');
    if (!accountsPayableTable) {
      return;
    }

    const supplierFk = accountsPayableTable.foreignKeys.find(
      (fk) => fk.name === 'FK_accounts_payable_supplier_id',
    );

    if (supplierFk) {
      await queryRunner.dropForeignKey('accounts_payable', supplierFk);
      accountsPayableTable = await queryRunner.getTable('accounts_payable');
    }

    if (accountsPayableTable?.findColumnByName('supplier_id')) {
      await queryRunner.dropColumn('accounts_payable', 'supplier_id');
      accountsPayableTable = await queryRunner.getTable('accounts_payable');
    }

    if (!accountsPayableTable?.findColumnByName('supplier_name')) {
      await queryRunner.addColumn(
        'accounts_payable',
        new TableColumn({
          name: 'supplier_name',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }
  }
}
