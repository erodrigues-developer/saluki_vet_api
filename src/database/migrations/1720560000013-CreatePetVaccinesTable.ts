import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreatePetVaccinesTable1720560000013 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('pet_vaccines');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'pet_vaccines',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'pet_id', type: 'bigint' },
            { name: 'vaccine_id', type: 'bigint' },
            { name: 'consultation_id', type: 'bigint', isNullable: true },
            { name: 'application_date', type: 'date' },
            { name: 'due_date', type: 'date', isNullable: true },
            {
              name: 'batch_number',
              type: 'varchar',
              length: '100',
              isNullable: true,
            },
            { name: 'veterinarian_id', type: 'bigint', isNullable: true },
            { name: 'notes', type: 'text', isNullable: true },
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

      await queryRunner.createForeignKeys('pet_vaccines', [
        new TableForeignKey({
          columnNames: ['pet_id'],
          referencedTableName: 'pets',
          referencedColumnNames: ['id'],
        }),
        new TableForeignKey({
          columnNames: ['vaccine_id'],
          referencedTableName: 'vaccines',
          referencedColumnNames: ['id'],
        }),
        new TableForeignKey({
          columnNames: ['consultation_id'],
          referencedTableName: 'consultations',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
        new TableForeignKey({
          columnNames: ['veterinarian_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('pet_vaccines');
    if (table) {
      await queryRunner.dropForeignKeys('pet_vaccines', table.foreignKeys);
    }
    await queryRunner.dropTable('pet_vaccines', true);
  }
}
