import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateExamCategoriesTable1774200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('exam_categories');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'exam_categories',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'name', type: 'varchar', length: '100' },
            {
              name: 'is_active',
              type: 'boolean',
              default: true,
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

      await queryRunner.createIndex(
        'exam_categories',
        new TableIndex({
          name: 'IDX_exam_categories_name',
          columnNames: ['name'],
        }),
      );

      await queryRunner.createIndex(
        'exam_categories',
        new TableIndex({
          name: 'IDX_exam_categories_is_active',
          columnNames: ['is_active'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('exam_categories');
    if (tableExists) {
      await queryRunner.dropTable('exam_categories', true);
    }
  }
}
