import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateClinicSetupTables1720560000006 implements MigrationInterface {
  name = 'CreateClinicSetupTables1720560000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'clinic_settings',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'appointment_slot_duration_minutes',
            type: 'int',
            default: 30,
          },
          {
            name: 'business_hours_json',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'logo_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'default_currency',
            type: 'varchar',
            length: '10',
            default: "'BRL'",
          },
          {
            name: 'notes',
            type: 'text',
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

    await queryRunner.createTable(
      new Table({
        name: 'appointment_types',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'default_duration_minutes',
            type: 'int',
            default: 30,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
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

    await queryRunner.createTable(
      new Table({
        name: 'appointment_statuses',
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
            length: '50',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'is_system',
            type: 'boolean',
            default: true,
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

    // Inserir status iniciais
    await queryRunner.query(`
      INSERT INTO appointment_statuses (code, name, is_system) VALUES
      ('SCHEDULED', 'Agendado', true),
      ('CONFIRMED', 'Confirmado', true),
      ('IN_PROGRESS', 'Em Atendimento', true),
      ('COMPLETED', 'Finalizado', true),
      ('CANCELED', 'Cancelado', true),
      ('NOSHOW', 'Não Compareceu', true);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('appointment_statuses');
    await queryRunner.dropTable('appointment_types');
    await queryRunner.dropTable('clinic_settings');
  }
}
