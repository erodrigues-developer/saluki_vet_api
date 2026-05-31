import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class EnhanceConsultationsForAiAssistedWorkflow1773800000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasOriginalComplaint = await queryRunner.hasColumn(
      'consultations',
      'original_complaint',
    );
    if (!hasOriginalComplaint) {
      await queryRunner.addColumn(
        'consultations',
        new TableColumn({
          name: 'original_complaint',
          type: 'text',
          isNullable: true,
        }),
      );
    }

    const hasAiOrganizedComplaint = await queryRunner.hasColumn(
      'consultations',
      'ai_organized_complaint',
    );
    if (!hasAiOrganizedComplaint) {
      await queryRunner.addColumn(
        'consultations',
        new TableColumn({
          name: 'ai_organized_complaint',
          type: 'text',
          isNullable: true,
        }),
      );
    }

    const hasAssistedAnamnesisSummary = await queryRunner.hasColumn(
      'consultations',
      'assisted_anamnesis_summary',
    );
    if (!hasAssistedAnamnesisSummary) {
      await queryRunner.addColumn(
        'consultations',
        new TableColumn({
          name: 'assisted_anamnesis_summary',
          type: 'text',
          isNullable: true,
        }),
      );
    }

    const hasAiReviewAudit = await queryRunner.hasColumn(
      'consultations',
      'ai_review_audit',
    );
    if (!hasAiReviewAudit) {
      await queryRunner.addColumn(
        'consultations',
        new TableColumn({
          name: 'ai_review_audit',
          type: 'jsonb',
          isNullable: true,
        }),
      );
    }

    const hasMigratedFromLegacyFlow = await queryRunner.hasColumn(
      'consultations',
      'migrated_from_legacy_flow',
    );
    if (!hasMigratedFromLegacyFlow) {
      await queryRunner.addColumn(
        'consultations',
        new TableColumn({
          name: 'migrated_from_legacy_flow',
          type: 'boolean',
          default: false,
        }),
      );
    }

    const hasRecordStatus = await queryRunner.hasColumn(
      'consultations',
      'record_status',
    );
    if (!hasRecordStatus) {
      await queryRunner.addColumn(
        'consultations',
        new TableColumn({
          name: 'record_status',
          type: 'varchar',
          length: '20',
          default: "'DRAFT'",
        }),
      );
    }

    const hasFinalizedAt = await queryRunner.hasColumn(
      'consultations',
      'finalized_at',
    );
    if (!hasFinalizedAt) {
      await queryRunner.addColumn(
        'consultations',
        new TableColumn({
          name: 'finalized_at',
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

    await dropIfExists('finalized_at');
    await dropIfExists('record_status');
    await dropIfExists('migrated_from_legacy_flow');
    await dropIfExists('ai_review_audit');
    await dropIfExists('assisted_anamnesis_summary');
    await dropIfExists('ai_organized_complaint');
    await dropIfExists('original_complaint');
  }
}
