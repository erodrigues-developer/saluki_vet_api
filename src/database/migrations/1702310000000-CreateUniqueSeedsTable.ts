import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUniqueSeedsTable1732310000000 implements MigrationInterface {
  private readonly table = 'unique_seeds';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable(this.table))) {
      await queryRunner.createTable(
        new Table({
          name: this.table,
          columns: [
            {
              name: 'id',
              type: 'bigserial',
              isPrimary: true,
            },
            {
              name: 'timestamp',
              type: 'bigint',
              isNullable: false,
            },
            {
              name: 'name',
              type: 'varchar',
              isNullable: false,
            },
          ],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.table, true, false, true);
  }
}
