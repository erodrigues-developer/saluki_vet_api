import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';
import {
  PERMISSIONS,
  ROLE_PERMISSION_CODES,
} from '../../modules/permissions/permissions.catalog';

export class CreatePermissionsAndRolePermissions1776400000000
  implements MigrationInterface
{
  name = 'CreatePermissionsAndRolePermissions1776400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const permissionsTable = await queryRunner.hasTable('permissions');
    if (!permissionsTable) {
      await queryRunner.createTable(
        new Table({
          name: 'permissions',
          columns: [
            {
              name: 'id',
              type: 'bigint',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'code',
              type: 'varchar',
              length: '120',
              isUnique: true,
              isNullable: false,
            },
            {
              name: 'name',
              type: 'varchar',
              length: '160',
              isNullable: false,
            },
            {
              name: 'description',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'module',
              type: 'varchar',
              length: '80',
              isNullable: false,
            },
            {
              name: 'resource',
              type: 'varchar',
              length: '80',
              isNullable: false,
            },
            {
              name: 'action',
              type: 'varchar',
              length: '40',
              isNullable: false,
            },
            {
              name: 'is_system',
              type: 'boolean',
              default: true,
              isNullable: false,
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

      await queryRunner.createIndices('permissions', [
        new TableIndex({
          name: 'idx_permissions_module_resource',
          columnNames: ['module', 'resource'],
        }),
        new TableIndex({
          name: 'idx_permissions_action',
          columnNames: ['action'],
        }),
      ]);
    }

    const rolePermissionsTable = await queryRunner.hasTable('role_permissions');
    if (!rolePermissionsTable) {
      await queryRunner.createTable(
        new Table({
          name: 'role_permissions',
          columns: [
            {
              name: 'role_id',
              type: 'bigint',
              isPrimary: true,
            },
            {
              name: 'permission_id',
              type: 'bigint',
              isPrimary: true,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'now()',
            },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKeys('role_permissions', [
        new TableForeignKey({
          columnNames: ['role_id'],
          referencedTableName: 'roles',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
        new TableForeignKey({
          columnNames: ['permission_id'],
          referencedTableName: 'permissions',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      ]);
    }

    await this.upsertRoles(queryRunner);
    await this.upsertPermissions(queryRunner);
    await this.assignRolePermissions(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const rolePermissionsTable = await queryRunner.getTable('role_permissions');
    if (rolePermissionsTable) {
      await queryRunner.dropForeignKeys(
        'role_permissions',
        rolePermissionsTable.foreignKeys,
      );
      await queryRunner.dropTable('role_permissions');
    }

    const permissionsTable = await queryRunner.getTable('permissions');
    if (permissionsTable) {
      await queryRunner.dropTable('permissions');
    }

    await queryRunner.query(
      `DELETE FROM roles WHERE code IN ('MANAGER', 'VETERINARIAN', 'VET_ASSISTANT', 'CASHIER', 'SUPPORT')`,
    );
  }

  private async upsertRoles(queryRunner: QueryRunner) {
    const roles = [
      ['ADMIN', 'Administrador'],
      ['MANAGER', 'Gerente'],
      ['VETERINARIAN', 'Veterinário'],
      ['VET', 'Veterinário'],
      ['VET_ASSISTANT', 'Assistente veterinário'],
      ['RECEPTIONIST', 'Recepcionista'],
      ['CASHIER', 'Caixa'],
      ['SUPPORT', 'Suporte'],
    ];

    for (const [code, name] of roles) {
      await queryRunner.query(
        `
          INSERT INTO roles (code, name, created_at, updated_at)
          VALUES ($1, $2, now(), now())
          ON CONFLICT (code)
          DO UPDATE SET name = EXCLUDED.name, updated_at = now()
        `,
        [code, name],
      );
    }
  }

  private async upsertPermissions(queryRunner: QueryRunner) {
    for (const item of PERMISSIONS) {
      await queryRunner.query(
        `
          INSERT INTO permissions
            (code, name, description, module, resource, action, is_system, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, true, now(), now())
          ON CONFLICT (code)
          DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            module = EXCLUDED.module,
            resource = EXCLUDED.resource,
            action = EXCLUDED.action,
            updated_at = now()
        `,
        [
          item.code,
          item.name,
          item.description || null,
          item.module,
          item.resource,
          item.action,
        ],
      );
    }
  }

  private async assignRolePermissions(queryRunner: QueryRunner) {
    for (const [roleCode, permissionCodes] of Object.entries(
      ROLE_PERMISSION_CODES,
    )) {
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
          [roleCode, permissionCode],
        );
      }
    }
  }
}
