import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreatePrescriptionsTable1720560000021
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('prescriptions');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'prescriptions',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'consultation_id', type: 'bigint', isNullable: true },
            { name: 'pet_id', type: 'bigint' },
            { name: 'veterinarian_id', type: 'bigint' },
            { name: 'prescribed_at', type: 'timestamp' },
            { name: 'content', type: 'text' },
            { name: 'expiration_date', type: 'date', isNullable: true },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKeys('prescriptions', [
        new TableForeignKey({
          columnNames: ['consultation_id'],
          referencedTableName: 'consultations',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
        }),
        new TableForeignKey({
          columnNames: ['pet_id'],
          referencedTableName: 'pets',
          referencedColumnNames: ['id'],
        }),
        new TableForeignKey({
          columnNames: ['veterinarian_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
        }),
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('prescriptions');
    if (table) {
      await queryRunner.dropForeignKeys('prescriptions', table.foreignKeys);
    }
    await queryRunner.dropTable('prescriptions', true);
  }
}
