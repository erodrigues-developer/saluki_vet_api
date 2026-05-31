import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsActiveToExamTypes1774200000003
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('exam_types', 'is_active');
    if (!hasColumn) {
      await queryRunner.addColumn(
        'exam_types',
        new TableColumn({
          name: 'is_active',
          type: 'boolean',
          isNullable: false,
          default: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('exam_types', 'is_active');
    if (hasColumn) {
      await queryRunner.dropColumn('exam_types', 'is_active');
    }
  }
}
