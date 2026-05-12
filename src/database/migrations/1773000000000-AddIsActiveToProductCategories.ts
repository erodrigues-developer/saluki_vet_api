import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsActiveToProductCategories1773000000000
  implements MigrationInterface
{
  name = 'AddIsActiveToProductCategories1773000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('product_categories');
    const hasColumn = table?.findColumnByName('is_active');
    if (!hasColumn) {
      await queryRunner.addColumn(
        'product_categories',
        new TableColumn({
          name: 'is_active',
          type: 'boolean',
          default: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('product_categories');
    const hasColumn = table?.findColumnByName('is_active');
    if (hasColumn) {
      await queryRunner.dropColumn('product_categories', 'is_active');
    }
  }
}
