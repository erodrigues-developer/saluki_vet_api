import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAnamnesisApprovalColumns1773900000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasApproved = await queryRunner.hasColumn(
      'consultations',
      'anamnesis_approved',
    );
    if (!hasApproved) {
      await queryRunner.addColumn(
        'consultations',
        new TableColumn({
          name: 'anamnesis_approved',
          type: 'boolean',
          default: false,
        }),
      );
    }

    const hasApprovedAt = await queryRunner.hasColumn(
      'consultations',
      'anamnesis_approved_at',
    );
    if (!hasApprovedAt) {
      await queryRunner.addColumn(
        'consultations',
        new TableColumn({
          name: 'anamnesis_approved_at',
          type: 'timestamp',
          isNullable: true,
        }),
      );
    }

    const hasApprovedBy = await queryRunner.hasColumn(
      'consultations',
      'anamnesis_approved_by_user_id',
    );
    if (!hasApprovedBy) {
      await queryRunner.addColumn(
        'consultations',
        new TableColumn({
          name: 'anamnesis_approved_by_user_id',
          type: 'bigint',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const dropIfExists = async (columnName: string) => {
      const hasColumn = await queryRunner.hasColumn('consultations', columnName);
      if (hasColumn) {
        await queryRunner.dropColumn('consultations', columnName);
      }
    };

    await dropIfExists('anamnesis_approved_by_user_id');
    await dropIfExists('anamnesis_approved_at');
    await dropIfExists('anamnesis_approved');
  }
}
