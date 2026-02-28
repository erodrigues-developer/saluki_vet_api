import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateBoxesTable1720560000014 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('boxes');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'boxes',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'name', type: 'varchar', length: '100' },
            { name: 'description', type: 'text', isNullable: true },
            { name: 'is_active', type: 'boolean', default: true },
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
          ],
        }),
        true,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('boxes', true);
  }
}
