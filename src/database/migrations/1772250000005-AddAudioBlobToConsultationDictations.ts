import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAudioBlobToConsultationDictations1772250000005
  implements MigrationInterface
{
  name = 'AddAudioBlobToConsultationDictations1772250000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('consultation_dictations', [
      new TableColumn({
        name: 'audio_file_name',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'audio_mime_type',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
      new TableColumn({
        name: 'audio_blob',
        type: 'bytea',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('consultation_dictations', 'audio_blob');
    await queryRunner.dropColumn('consultation_dictations', 'audio_mime_type');
    await queryRunner.dropColumn('consultation_dictations', 'audio_file_name');
  }
}
