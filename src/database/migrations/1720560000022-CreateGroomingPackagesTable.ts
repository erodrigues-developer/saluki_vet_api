import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateGroomingPackagesTable1720560000022
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('grooming_packages');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'grooming_packages',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'client_id', type: 'bigint' },
            { name: 'pet_id', type: 'bigint' },
            { name: 'total_sessions', type: 'int' },
            { name: 'used_sessions', type: 'int', default: 0 },
            {
              name: 'price',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            { name: 'is_paid', type: 'boolean', default: false },
            { name: 'expires_at', type: 'date', isNullable: true },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKeys('grooming_packages', [
        new TableForeignKey({
          columnNames: ['client_id'],
          referencedTableName: 'clients',
          referencedColumnNames: ['id'],
        }),
        new TableForeignKey({
          columnNames: ['pet_id'],
          referencedTableName: 'pets',
          referencedColumnNames: ['id'],
        }),
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('grooming_packages');
    if (table) {
      await queryRunner.dropForeignKeys('grooming_packages', table.foreignKeys);
    }
    await queryRunner.dropTable('grooming_packages', true);
  }
}
