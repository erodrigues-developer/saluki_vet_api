import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateBreedsTable1720560000003 implements MigrationInterface {
  name = 'CreateBreedsTable1720560000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'breeds',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'species_id',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'breeds',
      new TableForeignKey({
        columnNames: ['species_id'],
        referencedTableName: 'species',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('breeds');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.includes('species_id') && fk.referencedTableName === 'species',
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('breeds', foreignKey);
      }
    }
    await queryRunner.dropTable('breeds');
  }
}
