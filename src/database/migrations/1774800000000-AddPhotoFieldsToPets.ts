import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPhotoFieldsToPets1774800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const columns = [
      new TableColumn({
        name: 'photo_url',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
      new TableColumn({
        name: 'photo_storage_key',
        type: 'varchar',
        length: '500',
        isNullable: true,
      }),
    ];

    for (const column of columns) {
      const hasColumn = await queryRunner.hasColumn('pets', column.name);
      if (!hasColumn) {
        await queryRunner.addColumn('pets', column);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const columnNames = ['photo_storage_key', 'photo_url'];

    for (const columnName of columnNames) {
      const hasColumn = await queryRunner.hasColumn('pets', columnName);
      if (hasColumn) {
        await queryRunner.dropColumn('pets', columnName);
      }
    }
  }
}
