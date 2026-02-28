import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateExamRequestsTable1720560000019
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('exam_requests');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'exam_requests',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'consultation_id', type: 'bigint', isNullable: true },
            { name: 'pet_id', type: 'bigint' },
            { name: 'exam_type_id', type: 'bigint' },
            { name: 'requested_at', type: 'timestamp' },
            {
              name: 'status',
              type: 'varchar',
              length: '20',
              default: "'PENDING'",
            },
            { name: 'notes', type: 'text', isNullable: true },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKeys('exam_requests', [
        new TableForeignKey({
          columnNames: ['consultation_id'],
          referencedTableName: 'consultations',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
        new TableForeignKey({
          columnNames: ['pet_id'],
          referencedTableName: 'pets',
          referencedColumnNames: ['id'],
        }),
        new TableForeignKey({
          columnNames: ['exam_type_id'],
          referencedTableName: 'exam_types',
          referencedColumnNames: ['id'],
        }),
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('exam_requests');
    if (table) {
      await queryRunner.dropForeignKeys('exam_requests', table.foreignKeys);
    }
    await queryRunner.dropTable('exam_requests', true);
  }
}
