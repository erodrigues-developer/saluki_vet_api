import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateVeterinarianAvailabilityTables1773500000000 implements MigrationInterface {
  name = 'CreateVeterinarianAvailabilityTables1773500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'veterinarian_weekly_availabilities',
        columns: [
          { name: 'id', type: 'bigint', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'veterinarian_id', type: 'bigint' },
          { name: 'weekday', type: 'smallint' },
          { name: 'is_available', type: 'boolean', default: true },
          { name: 'periods', type: 'jsonb', default: "'[]'::jsonb" },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
        uniques: [{ name: 'uq_vet_weekday', columnNames: ['veterinarian_id', 'weekday'] }],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'veterinarian_availability_blocks',
        columns: [
          { name: 'id', type: 'bigint', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'veterinarian_id', type: 'bigint' },
          { name: 'date', type: 'date' },
          { name: 'start_time', type: 'varchar', length: '5' },
          { name: 'end_time', type: 'varchar', length: '5' },
          { name: 'reason', type: 'varchar', length: '120' },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'veterinarian_absences',
        columns: [
          { name: 'id', type: 'bigint', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'veterinarian_id', type: 'bigint' },
          { name: 'start_date', type: 'date' },
          { name: 'end_date', type: 'date' },
          { name: 'reason', type: 'varchar', length: '120' },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('veterinarian_weekly_availabilities', [
      new TableForeignKey({
        columnNames: ['veterinarian_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createForeignKeys('veterinarian_availability_blocks', [
      new TableForeignKey({
        columnNames: ['veterinarian_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createForeignKeys('veterinarian_absences', [
      new TableForeignKey({
        columnNames: ['veterinarian_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('veterinarian_absences');
    await queryRunner.dropTable('veterinarian_availability_blocks');
    await queryRunner.dropTable('veterinarian_weekly_availabilities');
  }
}
