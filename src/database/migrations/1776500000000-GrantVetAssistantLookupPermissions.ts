import { MigrationInterface, QueryRunner } from 'typeorm';

export class GrantVetAssistantLookupPermissions1776500000000
  implements MigrationInterface
{
  name = 'GrantVetAssistantLookupPermissions1776500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const permissionCodes = [
      'cadastros.appointment_types.view',
      'cadastros.appointment_statuses.view',
      'cadastros.boxes.view',
      'cadastros.products.view',
      'cadastros.procedures.view',
      'cadastros.exam_categories.view',
      'cadastros.exam_types.view',
      'cadastros.species.view',
      'cadastros.breeds.view',
      'cadastros.stock_locations.view',
    ];

    for (const permissionCode of permissionCodes) {
      await queryRunner.query(
        `
          INSERT INTO role_permissions (role_id, permission_id, created_at)
          SELECT r.id, p.id, now()
          FROM roles r
          JOIN permissions p ON p.code = $2
          WHERE r.code = $1
          ON CONFLICT (role_id, permission_id) DO NOTHING
        `,
        ['VET_ASSISTANT', permissionCode],
      );
    }
  }

  public async down(): Promise<void> {
    // Intencionalmente vazio: nao removemos permissoes que podem ter sido
    // mantidas ou ajustadas manualmente na tela de Permissoes.
  }
}
