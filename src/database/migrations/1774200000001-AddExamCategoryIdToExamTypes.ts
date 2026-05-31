import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class AddExamCategoryIdToExamTypes1774200000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('exam_types', 'exam_category_id');
    if (!hasColumn) {
      await queryRunner.addColumn(
        'exam_types',
        new TableColumn({
          name: 'exam_category_id',
          type: 'bigint',
          isNullable: true,
        }),
      );

      await queryRunner.createIndex(
        'exam_types',
        new TableIndex({
          name: 'IDX_exam_types_exam_category_id',
          columnNames: ['exam_category_id'],
        }),
      );

      await queryRunner.createForeignKey(
        'exam_types',
        new TableForeignKey({
          name: 'FK_exam_types_exam_category_id',
          columnNames: ['exam_category_id'],
          referencedTableName: 'exam_categories',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('exam_types');
    if (!table) return;

    const foreignKey = table.foreignKeys.find(
      (fk) => fk.name === 'FK_exam_types_exam_category_id',
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('exam_types', foreignKey);
    }

    const index = table.indices.find(
      (idx) => idx.name === 'IDX_exam_types_exam_category_id',
    );
    if (index) {
      await queryRunner.dropIndex('exam_types', index);
    }

    const hasColumn = table.columns.find((col) => col.name === 'exam_category_id');
    if (hasColumn) {
      await queryRunner.dropColumn('exam_types', 'exam_category_id');
    }
  }
}
