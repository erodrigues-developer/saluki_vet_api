import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateAccountsPayableTable1720560000024
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('accounts_payable');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'accounts_payable',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'description', type: 'varchar', length: '255' },
            {
              name: 'category',
              type: 'varchar',
              length: '100',
              isNullable: true,
            },
            { name: 'amount', type: 'decimal', precision: 10, scale: 2 },
            { name: 'due_date', type: 'date' },
            { name: 'paid_at', type: 'timestamp', isNullable: true },
            {
              name: 'status',
              type: 'varchar',
              length: '20',
              default: "'PENDING'",
            },
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
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('accounts_payable', true);
  }
}
