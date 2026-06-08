import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateInpatientRecordTransfersTable1774400000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('inpatient_record_transfers');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'inpatient_record_transfers',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'inpatient_record_id', type: 'bigint' },
            { name: 'from_box_id', type: 'bigint' },
            { name: 'to_box_id', type: 'bigint' },
            { name: 'reason', type: 'text' },
            { name: 'transferred_at', type: 'timestamp' },
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

      await queryRunner.createForeignKeys('inpatient_record_transfers', [
        new TableForeignKey({
          columnNames: ['inpatient_record_id'],
          referencedTableName: 'inpatient_records',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
        new TableForeignKey({
          columnNames: ['from_box_id'],
          referencedTableName: 'boxes',
          referencedColumnNames: ['id'],
        }),
        new TableForeignKey({
          columnNames: ['to_box_id'],
          referencedTableName: 'boxes',
          referencedColumnNames: ['id'],
        }),
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('inpatient_record_transfers');
    if (table) {
      await queryRunner.dropForeignKeys(
        'inpatient_record_transfers',
        table.foreignKeys,
      );
    }
    await queryRunner.dropTable('inpatient_record_transfers', true);
  }
}
