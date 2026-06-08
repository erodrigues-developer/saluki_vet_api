import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddImgUrlToProducts1774500000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const productsTable = await queryRunner.getTable('products');
    if (productsTable && !productsTable.findColumnByName('img_url')) {
      await queryRunner.addColumn(
        'products',
        new TableColumn({
          name: 'img_url',
          type: 'text',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const productsTable = await queryRunner.getTable('products');
    if (productsTable?.findColumnByName('img_url')) {
      await queryRunner.dropColumn('products', 'img_url');
    }
  }
}
