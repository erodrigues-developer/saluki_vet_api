import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateOperationalAndClinicalTables1720560000008
  implements MigrationInterface
{
  name = 'CreateOperationalAndClinicalTables1720560000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Appointments
    await queryRunner.createTable(
      new Table({
        name: 'appointments',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'pet_id', type: 'bigint' },
          { name: 'client_id', type: 'bigint' },
          { name: 'veterinarian_id', type: 'bigint', isNullable: true },
          { name: 'appointment_type_id', type: 'bigint' },
          { name: 'status_id', type: 'bigint' },
          { name: 'starts_at', type: 'timestamp' },
          { name: 'ends_at', type: 'timestamp', isNullable: true },
          { name: 'reason', type: 'text', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'created_by_user_id', type: 'bigint', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('appointments', [
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
        columnNames: ['veterinarian_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        columnNames: ['appointment_type_id'],
        referencedTableName: 'appointment_types',
        referencedColumnNames: ['id'],
      }),
      new TableForeignKey({
        columnNames: ['status_id'],
        referencedTableName: 'appointment_statuses',
        referencedColumnNames: ['id'],
      }),
      new TableForeignKey({
        columnNames: ['created_by_user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    ]);

    // 2. Consultations
    await queryRunner.createTable(
      new Table({
        name: 'consultations',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'appointment_id', type: 'bigint', isNullable: true },
          { name: 'pet_id', type: 'bigint' },
          { name: 'client_id', type: 'bigint' },
          { name: 'veterinarian_id', type: 'bigint' },
          { name: 'visit_date', type: 'timestamp' },
          {
            name: 'weight_kg',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'temperature_c',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          { name: 'main_complaint', type: 'text', isNullable: true },
          { name: 'clinical_findings', type: 'text', isNullable: true },
          { name: 'diagnosis', type: 'text', isNullable: true },
          { name: 'treatment_plan', type: 'text', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('consultations', [
      new TableForeignKey({
        columnNames: ['appointment_id'],
        referencedTableName: 'appointments',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
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
        columnNames: ['veterinarian_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
      }),
    ]);

    // 3. Consultation Procedures
    await queryRunner.createTable(
      new Table({
        name: 'consultation_procedures',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'consultation_id', type: 'bigint' },
          { name: 'procedure_id', type: 'bigint' },
          { name: 'quantity', type: 'int', default: 1 },
          { name: 'unit_price', type: 'decimal', precision: 10, scale: 2 },
          { name: 'total_price', type: 'decimal', precision: 10, scale: 2 },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('consultation_procedures', [
      new TableForeignKey({
        columnNames: ['consultation_id'],
        referencedTableName: 'consultations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['procedure_id'],
        referencedTableName: 'procedures',
        referencedColumnNames: ['id'],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('consultation_procedures');
    await queryRunner.dropTable('consultations');
    await queryRunner.dropTable('appointments');
  }
}
