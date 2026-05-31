import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateAiConversationsTables1774100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasConversations = await queryRunner.hasTable('ai_conversations');
    if (!hasConversations) {
      await queryRunner.createTable(
        new Table({
          name: 'ai_conversations',
          columns: [
            { name: 'id', type: 'bigserial', isPrimary: true },
            { name: 'user_id', type: 'bigint', isNullable: true },
            { name: 'context_type', type: 'varchar', length: '80' },
            { name: 'context_id', type: 'varchar', length: '120' },
            { name: 'title', type: 'varchar', length: '180', isNullable: true },
            {
              name: 'status',
              type: 'varchar',
              length: '20',
              default: "'OPEN'",
            },
            { name: 'metadata', type: 'jsonb', isNullable: true },
            { name: 'created_at', type: 'timestamp', default: 'now()' },
            { name: 'updated_at', type: 'timestamp', default: 'now()' },
          ],
        }),
      );
      await queryRunner.createIndex(
        'ai_conversations',
        new TableIndex({
          name: 'IDX_ai_conversations_context',
          columnNames: ['context_type', 'context_id'],
        }),
      );
      await queryRunner.createIndex(
        'ai_conversations',
        new TableIndex({
          name: 'IDX_ai_conversations_user_context',
          columnNames: ['user_id', 'context_type', 'context_id'],
        }),
      );
    }

    const hasMessages = await queryRunner.hasTable('ai_conversation_messages');
    if (!hasMessages) {
      await queryRunner.createTable(
        new Table({
          name: 'ai_conversation_messages',
          columns: [
            { name: 'id', type: 'bigserial', isPrimary: true },
            { name: 'conversation_id', type: 'bigint' },
            { name: 'user_id', type: 'bigint', isNullable: true },
            { name: 'role', type: 'varchar', length: '20' },
            { name: 'content', type: 'text' },
            { name: 'metadata', type: 'jsonb', isNullable: true },
            { name: 'created_at', type: 'timestamp', default: 'now()' },
          ],
        }),
      );
      await queryRunner.createForeignKey(
        'ai_conversation_messages',
        new TableForeignKey({
          name: 'FK_ai_conversation_messages_conversation',
          columnNames: ['conversation_id'],
          referencedTableName: 'ai_conversations',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
      await queryRunner.createIndex(
        'ai_conversation_messages',
        new TableIndex({
          name: 'IDX_ai_conversation_messages_conversation_created',
          columnNames: ['conversation_id', 'created_at'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('ai_conversation_messages')) {
      await queryRunner.dropTable('ai_conversation_messages');
    }
    if (await queryRunner.hasTable('ai_conversations')) {
      await queryRunner.dropTable('ai_conversations');
    }
  }
}
