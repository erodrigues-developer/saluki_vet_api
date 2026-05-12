import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEpic5TriageAndProcedureStock1772350000000
  implements MigrationInterface
{
  name = 'AddEpic5TriageAndProcedureStock1772350000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const appointments = await queryRunner.getTable('appointments');
    if (appointments && !appointments.findColumnByName('triage_risk')) {
      await queryRunner.addColumns('appointments', [
        new TableColumn({
          name: 'triage_risk',
          type: 'varchar',
          length: '20',
          isNullable: true,
        }),
        new TableColumn({
          name: 'triage_score',
          type: 'int',
          isNullable: true,
        }),
        new TableColumn({
          name: 'triage_notes',
          type: 'text',
          isNullable: true,
        }),
        new TableColumn({
          name: 'arrived_at',
          type: 'timestamp',
          isNullable: true,
        }),
      ]);
    }

    const procedures = await queryRunner.getTable('procedures');
    if (procedures && !procedures.findColumnByName('consumed_product_id')) {
      await queryRunner.addColumns('procedures', [
        new TableColumn({
          name: 'consumed_product_id',
          type: 'bigint',
          isNullable: true,
        }),
        new TableColumn({
          name: 'consumption_quantity',
          type: 'decimal',
          precision: 10,
          scale: 3,
          isNullable: true,
        }),
      ]);
      await queryRunner.query(`
        ALTER TABLE procedures
        ADD CONSTRAINT fk_procedures_consumed_product
        FOREIGN KEY (consumed_product_id) REFERENCES products(id)
        ON DELETE SET NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const procedures = await queryRunner.getTable('procedures');
    if (procedures?.findColumnByName('consumed_product_id')) {
      await queryRunner.query(
        'ALTER TABLE procedures DROP CONSTRAINT IF EXISTS fk_procedures_consumed_product',
      );
      await queryRunner.dropColumns('procedures', [
        'consumption_quantity',
        'consumed_product_id',
      ]);
    }

    const appointments = await queryRunner.getTable('appointments');
    if (appointments?.findColumnByName('triage_risk')) {
      await queryRunner.dropColumns('appointments', [
        'arrived_at',
        'triage_notes',
        'triage_score',
        'triage_risk',
      ]);
    }
  }
}
