import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateCommissionsTable1720560000026 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('commissions');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'commissions',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'user_id', type: 'bigint' },
            { name: 'sale_id', type: 'bigint', isNullable: true },
            { name: 'consultation_id', type: 'bigint', isNullable: true },
            { name: 'grooming_session_id', type: 'bigint', isNullable: true },
            { name: 'amount', type: 'decimal', precision: 10, scale: 2 },
            { name: 'calculated_at', type: 'timestamp' },
            { name: 'paid_at', type: 'timestamp', isNullable: true },
            {
              name: 'status',
              type: 'varchar',
              length: '20',
              default: "'PENDING'",
            },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKeys('commissions', [
        new TableForeignKey({
          columnNames: ['user_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
        }),
        new TableForeignKey({
          columnNames: ['sale_id'],
          referencedTableName: 'sales',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
        new TableForeignKey({
          columnNames: ['consultation_id'],
          referencedTableName: 'consultations',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
        new TableForeignKey({
          columnNames: ['grooming_session_id'],
          referencedTableName: 'grooming_sessions',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('commissions');
    if (table) {
      await queryRunner.dropForeignKeys('commissions', table.foreignKeys);
    }
    await queryRunner.dropTable('commissions', true);
  }
}
