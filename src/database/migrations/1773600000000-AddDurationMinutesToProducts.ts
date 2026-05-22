import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDurationMinutesToProducts1773600000000
  implements MigrationInterface
{
  name = 'AddDurationMinutesToProducts1773600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'products',
      new TableColumn({
        name: 'duration_minutes',
        type: 'integer',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('products', 'duration_minutes');
  }
}
