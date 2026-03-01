import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class UpdateAccountsPayableAndCreateAuditLogs1772249670365
  implements MigrationInterface
{
  name = 'UpdateAccountsPayableAndCreateAuditLogs1772249670365';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const auditLogsTableExists = await queryRunner.hasTable('audit_logs');

    if (!auditLogsTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'audit_logs',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'entity_name',
              type: 'varchar',
              length: '100',
            },
            {
              name: 'record_id',
              type: 'bigint',
            },
            {
              name: 'action',
              type: 'varchar',
              length: '20',
            },
            {
              name: 'old_values',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'new_values',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'user_id',
              type: 'bigint',
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
          foreignKeys: [
            {
              name: 'FK_audit_logs_user_id',
              columnNames: ['user_id'],
              referencedTableName: 'users',
              referencedColumnNames: ['id'],
              onDelete: 'SET NULL',
              onUpdate: 'NO ACTION',
            },
          ],
        }),
        true,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const auditLogsTableExists = await queryRunner.hasTable('audit_logs');
    if (auditLogsTableExists) {
      await queryRunner.dropTable('audit_logs', true);
    }
  }
}
