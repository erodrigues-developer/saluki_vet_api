import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreatePetsTable1720560000004 implements MigrationInterface {
  name = 'CreatePetsTable1720560000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'pets',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'client_id',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'species_id',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'breed_id',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'sex',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'date_of_birth',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'weight_kg',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'color',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'microchip_code',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'allergies',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'chronic_diseases',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            isNullable: false,
            default: true,
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
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('pets', [
      new TableForeignKey({
        columnNames: ['client_id'],
        referencedTableName: 'clients',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['species_id'],
        referencedTableName: 'species',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['breed_id'],
        referencedTableName: 'breeds',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('pets');
    if (table) {
      const foreignKeys = table.foreignKeys.filter((fk) =>
        ['client_id', 'species_id', 'breed_id'].some((column) =>
          fk.columnNames.includes(column),
        ),
      );
      if (foreignKeys.length > 0) {
        await queryRunner.dropForeignKeys('pets', foreignKeys);
      }
    }
    await queryRunner.dropTable('pets');
  }
}
