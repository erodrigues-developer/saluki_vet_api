import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateConsultationAttachmentsTable1774700000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('consultation_attachments');
    if (tableExists) return;

    await queryRunner.createTable(
      new Table({
        name: 'consultation_attachments',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'consultation_id', type: 'bigint' },
          { name: 'pet_id', type: 'bigint' },
          { name: 'client_id', type: 'bigint' },
          { name: 'uploaded_by_user_id', type: 'bigint', isNullable: true },
          {
            name: 'attachment_type',
            type: 'varchar',
            length: '30',
            default: "'DOCUMENT'",
          },
          { name: 'original_name', type: 'varchar', length: '255' },
          { name: 'mime_type', type: 'varchar', length: '150' },
          { name: 'file_size', type: 'int' },
          { name: 'storage_key', type: 'varchar', length: '500' },
          { name: 'file_url', type: 'varchar', length: '500' },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('consultation_attachments', [
      new TableForeignKey({
        columnNames: ['consultation_id'],
        referencedTableName: 'consultations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['pet_id'],
        referencedTableName: 'pets',
        referencedColumnNames: ['id'],
      }),
      new TableForeignKey({
        columnNames: ['client_id'],
        referencedTableName: 'clients',
        referencedColumnNames: ['id'],
      }),
      new TableForeignKey({
        columnNames: ['uploaded_by_user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    ]);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_consultation_attachments_consultation_id"
      ON "consultation_attachments" ("consultation_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('consultation_attachments');
    if (table) {
      await queryRunner.dropForeignKeys(
        'consultation_attachments',
        table.foreignKeys,
      );
    }
    await queryRunner.dropTable('consultation_attachments', true);
  }
}
