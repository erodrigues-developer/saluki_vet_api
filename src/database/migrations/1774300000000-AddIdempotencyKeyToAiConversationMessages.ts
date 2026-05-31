import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class AddIdempotencyKeyToAiConversationMessages1774300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('ai_conversation_messages');
    if (!table) return;

    if (!table.findColumnByName('idempotency_key')) {
      await queryRunner.addColumn(
        'ai_conversation_messages',
        new TableColumn({
          name: 'idempotency_key',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }

    const refreshedTable = await queryRunner.getTable('ai_conversation_messages');
    if (
      refreshedTable &&
      !refreshedTable.indices.some(
        (index) =>
          index.name ===
          'IDX_ai_conversation_messages_conversation_idempotency_key',
      )
    ) {
      await queryRunner.createIndex(
        'ai_conversation_messages',
        new TableIndex({
          name: 'IDX_ai_conversation_messages_conversation_idempotency_key',
          columnNames: ['conversation_id', 'idempotency_key'],
          isUnique: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('ai_conversation_messages');
    if (!table) return;

    const index = table.indices.find(
      (item) =>
        item.name ===
        'IDX_ai_conversation_messages_conversation_idempotency_key',
    );
    if (index) {
      await queryRunner.dropIndex('ai_conversation_messages', index);
    }

    if (table.findColumnByName('idempotency_key')) {
      await queryRunner.dropColumn('ai_conversation_messages', 'idempotency_key');
    }
  }
}
