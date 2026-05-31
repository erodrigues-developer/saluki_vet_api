import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddConsultiveSupportToConsultations1774000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasText = await queryRunner.hasColumn(
      'consultations',
      'consultive_support_text',
    );
    if (!hasText) {
      await queryRunner.addColumn(
        'consultations',
        new TableColumn({
          name: 'consultive_support_text',
          type: 'text',
          isNullable: true,
        }),
      );
    }

    const hasGeneratedAt = await queryRunner.hasColumn(
      'consultations',
      'consultive_support_generated_at',
    );
    if (!hasGeneratedAt) {
      await queryRunner.addColumn(
        'consultations',
        new TableColumn({
          name: 'consultive_support_generated_at',
          type: 'timestamp',
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

    await dropIfExists('consultive_support_generated_at');
    await dropIfExists('consultive_support_text');
  }
}
