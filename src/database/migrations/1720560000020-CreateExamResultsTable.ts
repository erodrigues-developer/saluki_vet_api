import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateExamResultsTable1720560000020 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('exam_results');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'exam_results',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'exam_request_id', type: 'bigint' },
            { name: 'result_data', type: 'text', isNullable: true },
            {
              name: 'file_url',
              type: 'varchar',
              length: '500',
              isNullable: true,
            },
            { name: 'completed_at', type: 'timestamp' },
            { name: 'veterinarian_id', type: 'bigint', isNullable: true },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKeys('exam_results', [
        new TableForeignKey({
          columnNames: ['exam_request_id'],
          referencedTableName: 'exam_requests',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
        new TableForeignKey({
          columnNames: ['veterinarian_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('exam_results');
    if (table) {
      await queryRunner.dropForeignKeys('exam_results', table.foreignKeys);
    }
    await queryRunner.dropTable('exam_results', true);
  }
}
