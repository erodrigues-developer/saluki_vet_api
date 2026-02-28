import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateVaccinesTable1720560000012 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('vaccines');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'vaccines',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'name', type: 'varchar', length: '255' },
            {
              name: 'manufacturer',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            { name: 'description', type: 'text', isNullable: true },
            { name: 'default_interval_days', type: 'int', isNullable: true },
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
    await queryRunner.dropTable('vaccines', true);
  }
}
