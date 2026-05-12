import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsActiveToSpecies1773100000000 implements MigrationInterface {
  name = 'AddIsActiveToSpecies1773100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('species');
    const hasColumn = table?.findColumnByName('is_active');

    if (!hasColumn) {
      await queryRunner.addColumn(
        'species',
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
    const table = await queryRunner.getTable('species');
    const hasColumn = table?.findColumnByName('is_active');

    if (hasColumn) {
      await queryRunner.dropColumn('species', 'is_active');
    }
  }
}
