import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class EnhanceExamResultsForUploads1774700000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const columns = [
      {
        name: 'storage_key',
        type: 'varchar',
        length: '500',
        isNullable: true,
      },
      {
        name: 'original_name',
        type: 'varchar',
        length: '255',
        isNullable: true,
      },
      {
        name: 'mime_type',
        type: 'varchar',
        length: '150',
        isNullable: true,
      },
      {
        name: 'file_size',
        type: 'int',
        isNullable: true,
      },
      {
        name: 'notes',
        type: 'text',
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
    ];

    for (const column of columns) {
      const hasColumn = await queryRunner.hasColumn('exam_results', column.name);
      if (!hasColumn) {
        await queryRunner.addColumn('exam_results', new TableColumn(column));
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const columnNames = [
      'storage_key',
      'original_name',
      'mime_type',
      'file_size',
      'notes',
      'created_at',
      'updated_at',
    ];

    for (const columnName of columnNames) {
      const hasColumn = await queryRunner.hasColumn('exam_results', columnName);
      if (hasColumn) {
        await queryRunner.dropColumn('exam_results', columnName);
      }
    }
  }
}
