import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class AddCommissionPayoutsAndFinancialOrigins1774900000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('sales')) {
      if (!(await queryRunner.hasColumn('sales', 'consultation_id'))) {
        await queryRunner.addColumn(
          'sales',
          new TableColumn({
            name: 'consultation_id',
            type: 'bigint',
            isNullable: true,
          }),
        );
      }

      if (!(await queryRunner.hasColumn('sales', 'appointment_id'))) {
        await queryRunner.addColumn(
          'sales',
          new TableColumn({
            name: 'appointment_id',
            type: 'bigint',
            isNullable: true,
          }),
        );
      }

      const salesTable = await queryRunner.getTable('sales');
      const hasConsultationFk = salesTable?.foreignKeys.some(
        (foreignKey) =>
          foreignKey.columnNames.length === 1 &&
          foreignKey.columnNames[0] === 'consultation_id',
      );

      if (!hasConsultationFk) {
        await queryRunner.createForeignKey(
          'sales',
          new TableForeignKey({
            name: 'FK_sales_consultation_id',
            columnNames: ['consultation_id'],
            referencedTableName: 'consultations',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          }),
        );
      }

      const refreshedSalesTable = await queryRunner.getTable('sales');
      const hasAppointmentFk = refreshedSalesTable?.foreignKeys.some(
        (foreignKey) =>
          foreignKey.columnNames.length === 1 &&
          foreignKey.columnNames[0] === 'appointment_id',
      );

      if (!hasAppointmentFk) {
        await queryRunner.createForeignKey(
          'sales',
          new TableForeignKey({
            name: 'FK_sales_appointment_id',
            columnNames: ['appointment_id'],
            referencedTableName: 'appointments',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          }),
        );
      }
    }

    if (await queryRunner.hasTable('accounts_payable')) {
      const columnsToAdd: TableColumn[] = [];

      if (!(await queryRunner.hasColumn('accounts_payable', 'beneficiary_user_id'))) {
        columnsToAdd.push(
          new TableColumn({
            name: 'beneficiary_user_id',
            type: 'bigint',
            isNullable: true,
          }),
        );
      }

      if (!(await queryRunner.hasColumn('accounts_payable', 'payment_method_id'))) {
        columnsToAdd.push(
          new TableColumn({
            name: 'payment_method_id',
            type: 'bigint',
            isNullable: true,
          }),
        );
      }

      if (!(await queryRunner.hasColumn('accounts_payable', 'origin_type'))) {
        columnsToAdd.push(
          new TableColumn({
            name: 'origin_type',
            type: 'varchar',
            length: '30',
            default: "'MANUAL'",
          }),
        );
      }

      if (!(await queryRunner.hasColumn('accounts_payable', 'origin_reference_id'))) {
        columnsToAdd.push(
          new TableColumn({
            name: 'origin_reference_id',
            type: 'bigint',
            isNullable: true,
          }),
        );
      }

      if (columnsToAdd.length) {
        await queryRunner.addColumns('accounts_payable', columnsToAdd);
      }

      let accountsPayableTable = await queryRunner.getTable('accounts_payable');
      if (accountsPayableTable) {
        const hasBeneficiaryFk = accountsPayableTable.foreignKeys.some(
          (foreignKey) => foreignKey.name === 'FK_accounts_payable_beneficiary_user_id',
        );
        if (!hasBeneficiaryFk) {
          await queryRunner.createForeignKey(
            'accounts_payable',
            new TableForeignKey({
              name: 'FK_accounts_payable_beneficiary_user_id',
              columnNames: ['beneficiary_user_id'],
              referencedTableName: 'users',
              referencedColumnNames: ['id'],
              onDelete: 'SET NULL',
            }),
          );
        }
      }

      accountsPayableTable = await queryRunner.getTable('accounts_payable');
      if (accountsPayableTable) {
        const hasPaymentMethodFk = accountsPayableTable.foreignKeys.some(
          (foreignKey) => foreignKey.name === 'FK_accounts_payable_payment_method_id',
        );
        if (!hasPaymentMethodFk) {
          await queryRunner.createForeignKey(
            'accounts_payable',
            new TableForeignKey({
              name: 'FK_accounts_payable_payment_method_id',
              columnNames: ['payment_method_id'],
              referencedTableName: 'payment_methods',
              referencedColumnNames: ['id'],
              onDelete: 'SET NULL',
            }),
          );
        }
      }

      accountsPayableTable = await queryRunner.getTable('accounts_payable');
      const accountPayableIndexes = accountsPayableTable?.indices.map(
        (index) => index.name,
      );

      if (
        accountsPayableTable &&
        !accountPayableIndexes?.includes('IDX_accounts_payable_origin_reference')
      ) {
        await queryRunner.createIndex(
          'accounts_payable',
          new TableIndex({
            name: 'IDX_accounts_payable_origin_reference',
            columnNames: ['origin_type', 'origin_reference_id'],
          }),
        );
      }
    }

    if (await queryRunner.hasTable('commissions')) {
      const columnsToAdd: TableColumn[] = [];

      if (!(await queryRunner.hasColumn('commissions', 'origin_type'))) {
        columnsToAdd.push(
          new TableColumn({
            name: 'origin_type',
            type: 'varchar',
            length: '30',
            isNullable: true,
          }),
        );
      }

      if (!(await queryRunner.hasColumn('commissions', 'origin_reference_id'))) {
        columnsToAdd.push(
          new TableColumn({
            name: 'origin_reference_id',
            type: 'bigint',
            isNullable: true,
          }),
        );
      }

      if (!(await queryRunner.hasColumn('commissions', 'appointment_id'))) {
        columnsToAdd.push(
          new TableColumn({
            name: 'appointment_id',
            type: 'bigint',
            isNullable: true,
          }),
        );
      }

      if (!(await queryRunner.hasColumn('commissions', 'reversal_of_commission_id'))) {
        columnsToAdd.push(
          new TableColumn({
            name: 'reversal_of_commission_id',
            type: 'bigint',
            isNullable: true,
          }),
        );
      }

      if (!(await queryRunner.hasColumn('commissions', 'canceled_at'))) {
        columnsToAdd.push(
          new TableColumn({
            name: 'canceled_at',
            type: 'timestamp',
            isNullable: true,
          }),
        );
      }

      if (!(await queryRunner.hasColumn('commissions', 'notes'))) {
        columnsToAdd.push(
          new TableColumn({
            name: 'notes',
            type: 'text',
            isNullable: true,
          }),
        );
      }

      if (columnsToAdd.length) {
        await queryRunner.addColumns('commissions', columnsToAdd);
      }

      let commissionsTable = await queryRunner.getTable('commissions');
      if (commissionsTable) {
        const hasAppointmentFk = commissionsTable.foreignKeys.some(
          (foreignKey) => foreignKey.name === 'FK_commissions_appointment_id',
        );
        if (!hasAppointmentFk) {
          await queryRunner.createForeignKey(
            'commissions',
            new TableForeignKey({
              name: 'FK_commissions_appointment_id',
              columnNames: ['appointment_id'],
              referencedTableName: 'appointments',
              referencedColumnNames: ['id'],
              onDelete: 'SET NULL',
            }),
          );
        }
      }

      commissionsTable = await queryRunner.getTable('commissions');
      if (commissionsTable) {
        const hasReversalFk = commissionsTable.foreignKeys.some(
          (foreignKey) =>
            foreignKey.name === 'FK_commissions_reversal_of_commission_id',
        );
        if (!hasReversalFk) {
          await queryRunner.createForeignKey(
            'commissions',
            new TableForeignKey({
              name: 'FK_commissions_reversal_of_commission_id',
              columnNames: ['reversal_of_commission_id'],
              referencedTableName: 'commissions',
              referencedColumnNames: ['id'],
              onDelete: 'SET NULL',
            }),
          );
        }
      }

      await queryRunner.query(
        'DROP INDEX IF EXISTS "uq_commissions_sale_procedure_not_null"',
      );

      await queryRunner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "uq_commissions_sale_procedure_origin"
        ON "commissions" ("sale_id", "procedure_id")
        WHERE "sale_id" IS NOT NULL
          AND "procedure_id" IS NOT NULL
          AND "reversal_of_commission_id" IS NULL
      `);

      commissionsTable = await queryRunner.getTable('commissions');
      const commissionIndexes = commissionsTable?.indices.map((index) => index.name);

      if (
        commissionsTable &&
        !commissionIndexes?.includes('IDX_commissions_status_user_calculated_at')
      ) {
        await queryRunner.createIndex(
          'commissions',
          new TableIndex({
            name: 'IDX_commissions_status_user_calculated_at',
            columnNames: ['status', 'user_id', 'calculated_at'],
          }),
        );
      }
    }

    const payoutTableExists = await queryRunner.hasTable('commission_payouts');
    if (!payoutTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'commission_payouts',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'user_id',
              type: 'bigint',
            },
            {
              name: 'account_payable_id',
              type: 'bigint',
              isNullable: true,
            },
            {
              name: 'period_start',
              type: 'date',
            },
            {
              name: 'period_end',
              type: 'date',
            },
            {
              name: 'gross_amount',
              type: 'decimal',
              precision: 10,
              scale: 2,
              default: 0,
            },
            {
              name: 'adjustment_amount',
              type: 'decimal',
              precision: 10,
              scale: 2,
              default: 0,
            },
            {
              name: 'net_amount',
              type: 'decimal',
              precision: 10,
              scale: 2,
              default: 0,
            },
            {
              name: 'status',
              type: 'varchar',
              length: '20',
              default: "'OPEN'",
            },
            {
              name: 'notes',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'paid_at',
              type: 'timestamp',
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
          foreignKeys: [
            {
              name: 'FK_commission_payouts_user_id',
              columnNames: ['user_id'],
              referencedTableName: 'users',
              referencedColumnNames: ['id'],
            },
            {
              name: 'FK_commission_payouts_account_payable_id',
              columnNames: ['account_payable_id'],
              referencedTableName: 'accounts_payable',
              referencedColumnNames: ['id'],
              onDelete: 'SET NULL',
            },
          ],
          indices: [
            {
              name: 'IDX_commission_payouts_status_user_period',
              columnNames: ['status', 'user_id', 'period_start', 'period_end'],
            },
          ],
        }),
        true,
      );
    }

    const payoutItemsTableExists = await queryRunner.hasTable(
      'commission_payout_items',
    );
    if (!payoutItemsTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'commission_payout_items',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'payout_id',
              type: 'bigint',
            },
            {
              name: 'commission_id',
              type: 'bigint',
            },
            {
              name: 'amount',
              type: 'decimal',
              precision: 10,
              scale: 2,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
          foreignKeys: [
            {
              name: 'FK_commission_payout_items_payout_id',
              columnNames: ['payout_id'],
              referencedTableName: 'commission_payouts',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            },
            {
              name: 'FK_commission_payout_items_commission_id',
              columnNames: ['commission_id'],
              referencedTableName: 'commissions',
              referencedColumnNames: ['id'],
            },
          ],
          indices: [
            {
              name: 'UQ_commission_payout_items_commission_id',
              columnNames: ['commission_id'],
              isUnique: true,
            },
          ],
        }),
        true,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('commission_payout_items')) {
      await queryRunner.dropTable('commission_payout_items', true);
    }

    if (await queryRunner.hasTable('commission_payouts')) {
      await queryRunner.dropTable('commission_payouts', true);
    }

    if (await queryRunner.hasTable('commissions')) {
      const commissionsTable = await queryRunner.getTable('commissions');

      const commissionIndex = commissionsTable?.indices.find(
        (index) => index.name === 'IDX_commissions_status_user_calculated_at',
      );
      if (commissionIndex) {
        await queryRunner.dropIndex('commissions', commissionIndex);
      }

      await queryRunner.query(
        'DROP INDEX IF EXISTS "uq_commissions_sale_procedure_origin"',
      );
      await queryRunner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "uq_commissions_sale_procedure_not_null"
        ON "commissions" ("sale_id", "procedure_id")
        WHERE "sale_id" IS NOT NULL AND "procedure_id" IS NOT NULL
      `);

      const reversalFk = commissionsTable?.foreignKeys.find(
        (foreignKey) =>
          foreignKey.name === 'FK_commissions_reversal_of_commission_id',
      );
      if (reversalFk) {
        await queryRunner.dropForeignKey('commissions', reversalFk);
      }

      const appointmentFk = commissionsTable?.foreignKeys.find(
        (foreignKey) => foreignKey.name === 'FK_commissions_appointment_id',
      );
      if (appointmentFk) {
        await queryRunner.dropForeignKey('commissions', appointmentFk);
      }

      const columnsToDrop = [
        'notes',
        'canceled_at',
        'reversal_of_commission_id',
        'appointment_id',
        'origin_reference_id',
        'origin_type',
      ];

      for (const columnName of columnsToDrop) {
        if (await queryRunner.hasColumn('commissions', columnName)) {
          await queryRunner.dropColumn('commissions', columnName);
        }
      }
    }

    if (await queryRunner.hasTable('accounts_payable')) {
      const accountsPayableTable = await queryRunner.getTable('accounts_payable');

      const originIndex = accountsPayableTable?.indices.find(
        (index) => index.name === 'IDX_accounts_payable_origin_reference',
      );
      if (originIndex) {
        await queryRunner.dropIndex('accounts_payable', originIndex);
      }

      const paymentMethodFk = accountsPayableTable?.foreignKeys.find(
        (foreignKey) =>
          foreignKey.name === 'FK_accounts_payable_payment_method_id',
      );
      if (paymentMethodFk) {
        await queryRunner.dropForeignKey('accounts_payable', paymentMethodFk);
      }

      const beneficiaryFk = accountsPayableTable?.foreignKeys.find(
        (foreignKey) =>
          foreignKey.name === 'FK_accounts_payable_beneficiary_user_id',
      );
      if (beneficiaryFk) {
        await queryRunner.dropForeignKey('accounts_payable', beneficiaryFk);
      }

      const columnsToDrop = [
        'origin_reference_id',
        'origin_type',
        'payment_method_id',
        'beneficiary_user_id',
      ];

      for (const columnName of columnsToDrop) {
        if (await queryRunner.hasColumn('accounts_payable', columnName)) {
          await queryRunner.dropColumn('accounts_payable', columnName);
        }
      }
    }

    if (await queryRunner.hasTable('sales')) {
      const salesTable = await queryRunner.getTable('sales');

      const appointmentFk = salesTable?.foreignKeys.find(
        (foreignKey) => foreignKey.name === 'FK_sales_appointment_id',
      );
      if (appointmentFk) {
        await queryRunner.dropForeignKey('sales', appointmentFk);
      }

      const consultationFk = salesTable?.foreignKeys.find(
        (foreignKey) => foreignKey.name === 'FK_sales_consultation_id',
      );
      if (consultationFk) {
        await queryRunner.dropForeignKey('sales', consultationFk);
      }

      if (await queryRunner.hasColumn('sales', 'appointment_id')) {
        await queryRunner.dropColumn('sales', 'appointment_id');
      }

      if (await queryRunner.hasColumn('sales', 'consultation_id')) {
        await queryRunner.dropColumn('sales', 'consultation_id');
      }
    }
  }
}
