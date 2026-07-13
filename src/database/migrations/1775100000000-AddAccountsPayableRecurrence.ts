import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class AddAccountsPayableRecurrence1775100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('account_payable_recurrences'))) {
      await queryRunner.createTable(
        new Table({
          name: 'account_payable_recurrences',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'description', type: 'varchar', length: '255' },
            { name: 'category', type: 'varchar', length: '100', isNullable: true },
            { name: 'amount', type: 'decimal', precision: 10, scale: 2 },
            { name: 'supplier_id', type: 'bigint', isNullable: true },
            { name: 'beneficiary_user_id', type: 'bigint', isNullable: true },
            { name: 'frequency', type: 'varchar', length: '20' },
            { name: 'interval_count', type: 'int', default: 1 },
            { name: 'first_due_date', type: 'date' },
            { name: 'ends_at', type: 'date', isNullable: true },
            { name: 'occurrences_limit', type: 'int', isNullable: true },
            { name: 'next_due_date', type: 'date' },
            { name: 'last_generated_due_date', type: 'date', isNullable: true },
            { name: 'is_active', type: 'boolean', default: true },
            { name: 'notes', type: 'text', isNullable: true },
            { name: 'origin_type', type: 'varchar', length: '30', default: "'MANUAL'" },
            { name: 'origin_reference_id', type: 'bigint', isNullable: true },
            { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
            { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          ],
        }),
        true,
      );
    }

    if (await queryRunner.hasTable('accounts_payable')) {
      const columnsToAdd: TableColumn[] = [];

      if (!(await queryRunner.hasColumn('accounts_payable', 'recurrence_id'))) {
        columnsToAdd.push(
          new TableColumn({
            name: 'recurrence_id',
            type: 'bigint',
            isNullable: true,
          }),
        );
      }

      if (!(await queryRunner.hasColumn('accounts_payable', 'recurrence_sequence'))) {
        columnsToAdd.push(
          new TableColumn({
            name: 'recurrence_sequence',
            type: 'int',
            isNullable: true,
          }),
        );
      }

      if (!(await queryRunner.hasColumn('accounts_payable', 'is_recurrence_generated'))) {
        columnsToAdd.push(
          new TableColumn({
            name: 'is_recurrence_generated',
            type: 'boolean',
            default: false,
          }),
        );
      }

      if (columnsToAdd.length) {
        await queryRunner.addColumns('accounts_payable', columnsToAdd);
      }

      let accountsTable = await queryRunner.getTable('accounts_payable');
      if (accountsTable) {
        const hasRecurrenceFk = accountsTable.foreignKeys.some(
          (foreignKey) => foreignKey.name === 'FK_accounts_payable_recurrence_id',
        );
        if (!hasRecurrenceFk) {
          await queryRunner.createForeignKey(
            'accounts_payable',
            new TableForeignKey({
              name: 'FK_accounts_payable_recurrence_id',
              columnNames: ['recurrence_id'],
              referencedTableName: 'account_payable_recurrences',
              referencedColumnNames: ['id'],
              onDelete: 'SET NULL',
            }),
          );
        }
      }

      accountsTable = await queryRunner.getTable('accounts_payable');
      const hasUniqueIndex = accountsTable?.indices.some(
        (index) => index.name === 'UQ_accounts_payable_recurrence_due_date',
      );

      if (accountsTable && !hasUniqueIndex) {
        await queryRunner.createIndex(
          'accounts_payable',
          new TableIndex({
            name: 'UQ_accounts_payable_recurrence_due_date',
            columnNames: ['recurrence_id', 'due_date'],
            isUnique: true,
          }),
        );
      }
    }

    if (await queryRunner.hasTable('account_payable_recurrences')) {
      const recurrenceTable = await queryRunner.getTable(
        'account_payable_recurrences',
      );

      if (
        recurrenceTable &&
        !recurrenceTable.foreignKeys.some(
          (foreignKey) =>
            foreignKey.name === 'FK_account_payable_recurrences_supplier_id',
        )
      ) {
        await queryRunner.createForeignKey(
          'account_payable_recurrences',
          new TableForeignKey({
            name: 'FK_account_payable_recurrences_supplier_id',
            columnNames: ['supplier_id'],
            referencedTableName: 'suppliers',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          }),
        );
      }

      const refreshed = await queryRunner.getTable('account_payable_recurrences');
      if (
        refreshed &&
        !refreshed.foreignKeys.some(
          (foreignKey) =>
            foreignKey.name ===
            'FK_account_payable_recurrences_beneficiary_user_id',
        )
      ) {
        await queryRunner.createForeignKey(
          'account_payable_recurrences',
          new TableForeignKey({
            name: 'FK_account_payable_recurrences_beneficiary_user_id',
            columnNames: ['beneficiary_user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          }),
        );
      }
    }

    if (await queryRunner.hasTable('clinic_settings')) {
      if (
        !(await queryRunner.hasColumn(
          'clinic_settings',
          'accounts_payable_recurrence_horizon_months',
        ))
      ) {
        await queryRunner.addColumn(
          'clinic_settings',
          new TableColumn({
            name: 'accounts_payable_recurrence_horizon_months',
            type: 'int',
            default: 12,
          }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('clinic_settings')) {
      if (
        await queryRunner.hasColumn(
          'clinic_settings',
          'accounts_payable_recurrence_horizon_months',
        )
      ) {
        await queryRunner.dropColumn(
          'clinic_settings',
          'accounts_payable_recurrence_horizon_months',
        );
      }
    }

    if (await queryRunner.hasTable('accounts_payable')) {
      const accountsTable = await queryRunner.getTable('accounts_payable');
      const recurrenceIndex = accountsTable?.indices.find(
        (index) => index.name === 'UQ_accounts_payable_recurrence_due_date',
      );
      if (recurrenceIndex) {
        await queryRunner.dropIndex('accounts_payable', recurrenceIndex);
      }

      const recurrenceFk = accountsTable?.foreignKeys.find(
        (foreignKey) => foreignKey.name === 'FK_accounts_payable_recurrence_id',
      );
      if (recurrenceFk) {
        await queryRunner.dropForeignKey('accounts_payable', recurrenceFk);
      }

      for (const columnName of [
        'is_recurrence_generated',
        'recurrence_sequence',
        'recurrence_id',
      ]) {
        if (await queryRunner.hasColumn('accounts_payable', columnName)) {
          await queryRunner.dropColumn('accounts_payable', columnName);
        }
      }
    }

    if (await queryRunner.hasTable('account_payable_recurrences')) {
      const recurrenceTable = await queryRunner.getTable(
        'account_payable_recurrences',
      );

      for (const foreignKeyName of [
        'FK_account_payable_recurrences_beneficiary_user_id',
        'FK_account_payable_recurrences_supplier_id',
      ]) {
        const foreignKey = recurrenceTable?.foreignKeys.find(
          (item) => item.name === foreignKeyName,
        );
        if (foreignKey) {
          await queryRunner.dropForeignKey(
            'account_payable_recurrences',
            foreignKey,
          );
        }
      }

      await queryRunner.dropTable('account_payable_recurrences', true);
    }
  }
}
