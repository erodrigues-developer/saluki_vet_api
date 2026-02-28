import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateAccountsReceivableTable1720560000025
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('accounts_receivable');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'accounts_receivable',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'sale_id', type: 'bigint', isNullable: true },
            { name: 'client_id', type: 'bigint', isNullable: true },
            { name: 'description', type: 'varchar', length: '255' },
            { name: 'amount', type: 'decimal', precision: 10, scale: 2 },
            { name: 'due_date', type: 'date' },
            { name: 'paid_at', type: 'timestamp', isNullable: true },
            {
              name: 'status',
              type: 'varchar',
              length: '20',
              default: "'PENDING'",
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

      await queryRunner.createForeignKeys('accounts_receivable', [
        new TableForeignKey({
          columnNames: ['sale_id'],
          referencedTableName: 'sales',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
        new TableForeignKey({
          columnNames: ['client_id'],
          referencedTableName: 'clients',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('accounts_receivable');
    if (table) {
      await queryRunner.dropForeignKeys(
        'accounts_receivable',
        table.foreignKeys,
      );
    }
    await queryRunner.dropTable('accounts_receivable', true);
  }
}
