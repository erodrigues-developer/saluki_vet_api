import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDeletedAtToExamCategories1774200000002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasDeletedAt = await queryRunner.hasColumn(
      'exam_categories',
      'deleted_at',
    );

    if (!hasDeletedAt) {
      await queryRunner.addColumn(
        'exam_categories',
        new TableColumn({
          name: 'deleted_at',
          type: 'timestamp',
          isNullable: true,
        }),
      );
    }

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_exam_categories_name_unique_active" ON "exam_categories" (LOWER(TRIM("name"))) WHERE "deleted_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_exam_categories_name_unique_active"',
    );

    const hasDeletedAt = await queryRunner.hasColumn(
      'exam_categories',
      'deleted_at',
    );

    if (hasDeletedAt) {
      await queryRunner.dropColumn('exam_categories', 'deleted_at');
    }
  }
}
