import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateConsultationDictationsTable1772250000004
  implements MigrationInterface
{
  name = 'CreateConsultationDictationsTable1772250000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'consultation_dictations',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'consultation_id',
            type: 'bigint',
          },
          {
            name: 'created_by_user_id',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'PENDING'",
          },
          {
            name: 'capture_source',
            type: 'varchar',
            length: '30',
            default: "'MANUAL_TEXT'",
          },
          {
            name: 'language',
            type: 'varchar',
            length: '20',
            default: "'pt-BR'",
          },
          {
            name: 'audio_duration_seconds',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'transcript_draft',
            type: 'text',
          },
          {
            name: 'transcript_final',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'structured_payload',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'failure_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'processing_attempts',
            type: 'int',
            default: 0,
          },
          {
            name: 'processing_started_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'processed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('consultation_dictations', [
      new TableForeignKey({
        columnNames: ['consultation_id'],
        referencedTableName: 'consultations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['created_by_user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('consultation_dictations');
  }
}
