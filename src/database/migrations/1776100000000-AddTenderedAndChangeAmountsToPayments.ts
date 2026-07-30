import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTenderedAndChangeAmountsToPayments1776100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('payments', [
      new TableColumn({
        name: 'tendered_amount',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
      }),
      new TableColumn({
        name: 'change_amount',
        type: 'decimal',
        precision: 10,
        scale: 2,
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('payments', 'change_amount');
    await queryRunner.dropColumn('payments', 'tendered_amount');
  }
}
