import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsActiveToBreeds1773100000001 implements MigrationInterface {
  name = 'AddIsActiveToBreeds1773100000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('breeds');
    const hasColumn = table?.findColumnByName('is_active');

    if (!hasColumn) {
      await queryRunner.addColumn(
        'breeds',
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
    const table = await queryRunner.getTable('breeds');
    const hasColumn = table?.findColumnByName('is_active');

    if (hasColumn) {
      await queryRunner.dropColumn('breeds', 'is_active');
    }
  }
}
