import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateFiscalFoundation1776300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'fiscal_profiles',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'code', type: 'varchar', length: '50', isUnique: true },
          { name: 'trade_name', type: 'varchar', length: '255' },
          { name: 'legal_name', type: 'varchar', length: '255' },
          { name: 'cnpj', type: 'varchar', length: '20' },
          { name: 'cpf', type: 'varchar', length: '20', isNullable: true },
          { name: 'ie', type: 'varchar', length: '32', isNullable: true },
          { name: 'im', type: 'varchar', length: '32', isNullable: true },
          { name: 'cnae', type: 'varchar', length: '20', isNullable: true },
          { name: 'crt', type: 'varchar', length: '10', isNullable: true },
          { name: 'tax_regime', type: 'varchar', length: '50', isNullable: true },
          { name: 'phone', type: 'varchar', length: '50', isNullable: true },
          { name: 'email', type: 'varchar', length: '255', isNullable: true },
          { name: 'street', type: 'varchar', length: '255', isNullable: true },
          { name: 'number', type: 'varchar', length: '50', isNullable: true },
          { name: 'complement', type: 'varchar', length: '255', isNullable: true },
          { name: 'district', type: 'varchar', length: '255', isNullable: true },
          { name: 'city', type: 'varchar', length: '255', isNullable: true },
          { name: 'state', type: 'varchar', length: '2', isNullable: true },
          { name: 'zip_code', type: 'varchar', length: '20', isNullable: true },
          { name: 'ibge_city_code', type: 'varchar', length: '10', isNullable: true },
          { name: 'country_code', type: 'varchar', length: '4', default: "'1058'" },
          {
            name: 'fiscal_mode',
            type: 'varchar',
            length: '30',
            default: "'INATIVO'",
          },
          { name: 'is_active', type: 'boolean', default: true },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'fiscal_certificate_bindings',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'fiscal_profile_id', type: 'bigint' },
          { name: 'certificate_type', type: 'varchar', length: '10', default: "'A1'" },
          { name: 'storage_mode', type: 'varchar', length: '20', default: "'S3'" },
          { name: 's3_bucket', type: 'varchar', length: '255' },
          { name: 's3_object_key', type: 'varchar', length: '500' },
          { name: 's3_object_version', type: 'varchar', length: '255', isNullable: true },
          { name: 'encrypted_password', type: 'text' },
          { name: 'encryption_key_ref', type: 'varchar', length: '255', isNullable: true },
          { name: 'serial_number', type: 'varchar', length: '255', isNullable: true },
          { name: 'subject_name', type: 'varchar', length: '500', isNullable: true },
          { name: 'issuer_name', type: 'varchar', length: '500', isNullable: true },
          { name: 'valid_from', type: 'timestamp', isNullable: true },
          { name: 'valid_to', type: 'timestamp', isNullable: true },
          { name: 'last_validation_at', type: 'timestamp', isNullable: true },
          { name: 'cache_invalidation_token', type: 'varchar', length: '100', isNullable: true },
          { name: 'is_active', type: 'boolean', default: true },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'fiscal_nfce_configs',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'fiscal_profile_id', type: 'bigint' },
          { name: 'environment', type: 'varchar', length: '20' },
          { name: 'series', type: 'int' },
          { name: 'csc_id', type: 'varchar', length: '20' },
          { name: 'encrypted_csc', type: 'text' },
          { name: 'contingency_enabled', type: 'boolean', default: false },
          { name: 'contingency_alert_after_minutes', type: 'int', default: 60 },
          { name: 'contingency_critical_after_minutes', type: 'int', default: 720 },
          { name: 'is_active', type: 'boolean', default: true },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'fiscal_document_sequences',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'fiscal_profile_id', type: 'bigint' },
          { name: 'document_type', type: 'varchar', length: '20' },
          { name: 'environment', type: 'varchar', length: '20' },
          { name: 'series', type: 'int' },
          { name: 'current_number', type: 'int', default: 0 },
          { name: 'last_used_at', type: 'timestamp', isNullable: true },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'fiscal_documents',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'sale_id', type: 'bigint', isNullable: true },
          { name: 'source_type', type: 'varchar', length: '30', default: "'SALE'" },
          { name: 'document_type', type: 'varchar', length: '20' },
          { name: 'fiscal_profile_id', type: 'bigint' },
          { name: 'client_id', type: 'bigint', isNullable: true },
          { name: 'status', type: 'varchar', length: '50' },
          { name: 'environment', type: 'varchar', length: '20' },
          { name: 'series', type: 'int' },
          { name: 'number', type: 'int' },
          { name: 'idempotency_key', type: 'varchar', length: '255' },
          { name: 'rps_number', type: 'varchar', length: '50', isNullable: true },
          { name: 'verification_code', type: 'varchar', length: '100', isNullable: true },
          { name: 'access_key', type: 'varchar', length: '80', isNullable: true },
          { name: 'protocol_number', type: 'varchar', length: '80', isNullable: true },
          { name: 'municipal_protocol', type: 'varchar', length: '100', isNullable: true },
          { name: 'issued_at', type: 'timestamp', isNullable: true },
          { name: 'authorized_at', type: 'timestamp', isNullable: true },
          { name: 'canceled_at', type: 'timestamp', isNullable: true },
          { name: 'contingency_mode', type: 'varchar', length: '50', isNullable: true },
          {
            name: 'total_products_amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'total_services_amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'discount_amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'total_amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          { name: 'raw_request_json', type: 'jsonb', isNullable: true },
          { name: 'raw_response_json', type: 'jsonb', isNullable: true },
          { name: 'error_message', type: 'text', isNullable: true },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'fiscal_document_items',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'fiscal_document_id', type: 'bigint' },
          { name: 'sale_item_id', type: 'bigint', isNullable: true },
          { name: 'source_entity_type', type: 'varchar', length: '30' },
          { name: 'source_entity_id', type: 'bigint', isNullable: true },
          { name: 'description', type: 'varchar', length: '255' },
          { name: 'ncm', type: 'varchar', length: '20', isNullable: true },
          { name: 'cest', type: 'varchar', length: '20', isNullable: true },
          { name: 'cfop', type: 'varchar', length: '10', isNullable: true },
          { name: 'service_code', type: 'varchar', length: '50', isNullable: true },
          { name: 'lc116_code', type: 'varchar', length: '20', isNullable: true },
          { name: 'quantity', type: 'decimal', precision: 12, scale: 3 },
          { name: 'commercial_unit', type: 'varchar', length: '20', isNullable: true },
          { name: 'tax_unit', type: 'varchar', length: '20', isNullable: true },
          { name: 'unit_amount', type: 'decimal', precision: 12, scale: 2 },
          { name: 'gross_amount', type: 'decimal', precision: 12, scale: 2 },
          { name: 'discount_amount', type: 'decimal', precision: 12, scale: 2, default: 0 },
          { name: 'total_amount', type: 'decimal', precision: 12, scale: 2 },
          { name: 'tax_snapshot_json', type: 'jsonb' },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'fiscal_document_events',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'fiscal_document_id', type: 'bigint' },
          { name: 'event_type', type: 'varchar', length: '50' },
          { name: 'status', type: 'varchar', length: '50' },
          { name: 'protocol_number', type: 'varchar', length: '80', isNullable: true },
          { name: 'justification', type: 'text', isNullable: true },
          { name: 'payload_json', type: 'jsonb', isNullable: true },
          { name: 'response_json', type: 'jsonb', isNullable: true },
          { name: 'occurred_at', type: 'timestamp' },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'fiscal_document_files',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'fiscal_document_id', type: 'bigint' },
          { name: 'file_type', type: 'varchar', length: '50' },
          { name: 'storage_backend', type: 'varchar', length: '20' },
          { name: 'storage_path', type: 'varchar', length: '700' },
          { name: 'checksum', type: 'varchar', length: '128', isNullable: true },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'fiscal_issue_requests',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'sale_id', type: 'bigint', isNullable: true },
          { name: 'fiscal_document_id', type: 'bigint', isNullable: true },
          { name: 'document_type', type: 'varchar', length: '20' },
          { name: 'request_type', type: 'varchar', length: '30' },
          { name: 'status', type: 'varchar', length: '50' },
          { name: 'attempt_count', type: 'int', default: 0 },
          { name: 'next_retry_at', type: 'timestamp', isNullable: true },
          { name: 'last_error', type: 'text', isNullable: true },
          { name: 'payload_json', type: 'jsonb', isNullable: true },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await this.createFiscalForeignKeys(queryRunner);
    await this.createFiscalIndexes(queryRunner);
    await this.addExistingTableFiscalColumns(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropExistingTableFiscalColumns(queryRunner);
    await queryRunner.dropTable('fiscal_issue_requests', true);
    await queryRunner.dropTable('fiscal_document_files', true);
    await queryRunner.dropTable('fiscal_document_events', true);
    await queryRunner.dropTable('fiscal_document_items', true);
    await queryRunner.dropTable('fiscal_documents', true);
    await queryRunner.dropTable('fiscal_document_sequences', true);
    await queryRunner.dropTable('fiscal_nfce_configs', true);
    await queryRunner.dropTable('fiscal_certificate_bindings', true);
    await queryRunner.dropTable('fiscal_profiles', true);
  }

  private async createFiscalForeignKeys(queryRunner: QueryRunner) {
    await queryRunner.createForeignKeys('fiscal_certificate_bindings', [
      new TableForeignKey({
        columnNames: ['fiscal_profile_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'fiscal_profiles',
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createForeignKeys('fiscal_nfce_configs', [
      new TableForeignKey({
        columnNames: ['fiscal_profile_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'fiscal_profiles',
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createForeignKeys('fiscal_document_sequences', [
      new TableForeignKey({
        columnNames: ['fiscal_profile_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'fiscal_profiles',
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createForeignKeys('fiscal_documents', [
      new TableForeignKey({
        columnNames: ['sale_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'sales',
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        columnNames: ['fiscal_profile_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'fiscal_profiles',
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        columnNames: ['client_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'clients',
        onDelete: 'SET NULL',
      }),
    ]);

    await queryRunner.createForeignKeys('fiscal_document_items', [
      new TableForeignKey({
        columnNames: ['fiscal_document_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'fiscal_documents',
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['sale_item_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'sale_items',
        onDelete: 'SET NULL',
      }),
    ]);

    await queryRunner.createForeignKeys('fiscal_document_events', [
      new TableForeignKey({
        columnNames: ['fiscal_document_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'fiscal_documents',
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createForeignKeys('fiscal_document_files', [
      new TableForeignKey({
        columnNames: ['fiscal_document_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'fiscal_documents',
        onDelete: 'CASCADE',
      }),
    ]);

    await queryRunner.createForeignKeys('fiscal_issue_requests', [
      new TableForeignKey({
        columnNames: ['sale_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'sales',
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        columnNames: ['fiscal_document_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'fiscal_documents',
        onDelete: 'SET NULL',
      }),
    ]);
  }

  private async createFiscalIndexes(queryRunner: QueryRunner) {
    await queryRunner.createIndex(
      'fiscal_nfce_configs',
      new TableIndex({
        name: 'ux_fiscal_nfce_profile_env',
        columnNames: ['fiscal_profile_id', 'environment'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'fiscal_document_sequences',
      new TableIndex({
        name: 'ux_fiscal_sequences_scope',
        columnNames: ['fiscal_profile_id', 'document_type', 'environment', 'series'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'fiscal_documents',
      new TableIndex({
        name: 'ux_fiscal_documents_idempotency',
        columnNames: ['idempotency_key'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'fiscal_documents',
      new TableIndex({
        name: 'idx_fiscal_documents_sale',
        columnNames: ['sale_id'],
      }),
    );
    await queryRunner.createIndex(
      'fiscal_documents',
      new TableIndex({
        name: 'idx_fiscal_documents_status',
        columnNames: ['status'],
      }),
    );
    await queryRunner.createIndex(
      'fiscal_issue_requests',
      new TableIndex({
        name: 'idx_fiscal_issue_requests_status_retry',
        columnNames: ['status', 'next_retry_at'],
      }),
    );
  }

  private async addExistingTableFiscalColumns(queryRunner: QueryRunner) {
    await queryRunner.addColumns('clinic_settings', [
      new TableColumn({
        name: 'default_fiscal_profile_id',
        type: 'bigint',
        isNullable: true,
      }),
      new TableColumn({
        name: 'fiscal_module_enabled',
        type: 'boolean',
        default: false,
      }),
    ]);
    await queryRunner.createForeignKey(
      'clinic_settings',
      new TableForeignKey({
        columnNames: ['default_fiscal_profile_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'fiscal_profiles',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.addColumns('clients', [
      new TableColumn({ name: 'person_type', type: 'varchar', length: '10', isNullable: true }),
      new TableColumn({ name: 'state_tax_id', type: 'varchar', length: '32', isNullable: true }),
      new TableColumn({ name: 'municipal_tax_id', type: 'varchar', length: '32', isNullable: true }),
      new TableColumn({ name: 'state_taxpayer_type', type: 'varchar', length: '30', isNullable: true }),
      new TableColumn({ name: 'suframa', type: 'varchar', length: '32', isNullable: true }),
      new TableColumn({ name: 'country_code', type: 'varchar', length: '4', isNullable: true }),
      new TableColumn({ name: 'country_name', type: 'varchar', length: '100', isNullable: true }),
      new TableColumn({ name: 'ibge_city_code', type: 'varchar', length: '10', isNullable: true }),
      new TableColumn({ name: 'tax_email', type: 'varchar', length: '255', isNullable: true }),
    ]);

    await queryRunner.addColumns('products', [
      new TableColumn({ name: 'fiscal_ncm', type: 'varchar', length: '20', isNullable: true }),
      new TableColumn({ name: 'fiscal_cest', type: 'varchar', length: '20', isNullable: true }),
      new TableColumn({ name: 'fiscal_origin', type: 'varchar', length: '5', isNullable: true }),
      new TableColumn({ name: 'fiscal_cfop_nfce_default', type: 'varchar', length: '10', isNullable: true }),
      new TableColumn({ name: 'fiscal_ean', type: 'varchar', length: '32', isNullable: true }),
      new TableColumn({ name: 'fiscal_ean_tributable', type: 'varchar', length: '32', isNullable: true }),
      new TableColumn({ name: 'fiscal_unit_tributable', type: 'varchar', length: '20', isNullable: true }),
      new TableColumn({
        name: 'fiscal_conversion_factor',
        type: 'decimal',
        precision: 12,
        scale: 6,
        isNullable: true,
      }),
      new TableColumn({ name: 'fiscal_icms_cst', type: 'varchar', length: '10', isNullable: true }),
      new TableColumn({ name: 'fiscal_icms_csosn', type: 'varchar', length: '10', isNullable: true }),
      new TableColumn({ name: 'fiscal_pis_cst', type: 'varchar', length: '10', isNullable: true }),
      new TableColumn({ name: 'fiscal_cofins_cst', type: 'varchar', length: '10', isNullable: true }),
      new TableColumn({ name: 'fiscal_is_billable', type: 'boolean', default: true }),
    ]);

    await queryRunner.addColumns('procedures', [
      new TableColumn({ name: 'service_code', type: 'varchar', length: '50', isNullable: true }),
      new TableColumn({ name: 'municipal_service_code', type: 'varchar', length: '50', isNullable: true }),
      new TableColumn({ name: 'lc116_code', type: 'varchar', length: '20', isNullable: true }),
      new TableColumn({ name: 'iss_rate', type: 'decimal', precision: 7, scale: 4, isNullable: true }),
      new TableColumn({ name: 'iss_withheld', type: 'boolean', default: false }),
      new TableColumn({ name: 'service_city_ibge_code', type: 'varchar', length: '10', isNullable: true }),
      new TableColumn({ name: 'fiscal_is_billable', type: 'boolean', default: true }),
    ]);

    await queryRunner.addColumns('sale_items', [
      new TableColumn({ name: 'fiscal_group', type: 'varchar', length: '20', isNullable: true }),
      new TableColumn({ name: 'fiscal_document_id', type: 'bigint', isNullable: true }),
      new TableColumn({ name: 'fiscal_status', type: 'varchar', length: '50', isNullable: true }),
    ]);
    await queryRunner.createForeignKey(
      'sale_items',
      new TableForeignKey({
        columnNames: ['fiscal_document_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'fiscal_documents',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.addColumns('sales', [
      new TableColumn({ name: 'fiscal_status', type: 'varchar', length: '50', isNullable: true }),
      new TableColumn({ name: 'has_fiscal_pending', type: 'boolean', default: false }),
      new TableColumn({ name: 'issued_product_document_id', type: 'bigint', isNullable: true }),
      new TableColumn({ name: 'issued_service_document_id', type: 'bigint', isNullable: true }),
      new TableColumn({ name: 'fiscal_notes', type: 'text', isNullable: true }),
    ]);
    await queryRunner.createForeignKeys('sales', [
      new TableForeignKey({
        columnNames: ['issued_product_document_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'fiscal_documents',
        onDelete: 'SET NULL',
      }),
      new TableForeignKey({
        columnNames: ['issued_service_document_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'fiscal_documents',
        onDelete: 'SET NULL',
      }),
    ]);

    await queryRunner.addColumns('payments', [
      new TableColumn({ name: 'fiscal_payment_type_code', type: 'varchar', length: '10', isNullable: true }),
      new TableColumn({ name: 'card_brand_code', type: 'varchar', length: '10', isNullable: true }),
      new TableColumn({ name: 'integration_type', type: 'varchar', length: '30', isNullable: true }),
      new TableColumn({ name: 'authorization_code', type: 'varchar', length: '100', isNullable: true }),
      new TableColumn({ name: 'acquirer_cnpj', type: 'varchar', length: '20', isNullable: true }),
    ]);
    await queryRunner.addColumns('payment_methods', [
      new TableColumn({ name: 'fiscal_payment_type_code', type: 'varchar', length: '10', isNullable: true }),
      new TableColumn({ name: 'integration_type', type: 'varchar', length: '30', isNullable: true }),
    ]);
  }

  private async dropExistingTableFiscalColumns(queryRunner: QueryRunner) {
    await this.dropForeignKeysByColumns(queryRunner, 'payment_methods', []);
    await queryRunner.dropColumns('payment_methods', [
      'integration_type',
      'fiscal_payment_type_code',
    ]);
    await queryRunner.dropColumns('payments', [
      'acquirer_cnpj',
      'authorization_code',
      'integration_type',
      'card_brand_code',
      'fiscal_payment_type_code',
    ]);

    await this.dropForeignKeysByColumns(queryRunner, 'sales', [
      'issued_product_document_id',
      'issued_service_document_id',
    ]);
    await queryRunner.dropColumns('sales', [
      'fiscal_notes',
      'issued_service_document_id',
      'issued_product_document_id',
      'has_fiscal_pending',
      'fiscal_status',
    ]);

    await this.dropForeignKeysByColumns(queryRunner, 'sale_items', [
      'fiscal_document_id',
    ]);
    await queryRunner.dropColumns('sale_items', [
      'fiscal_status',
      'fiscal_document_id',
      'fiscal_group',
    ]);

    await queryRunner.dropColumns('procedures', [
      'fiscal_is_billable',
      'service_city_ibge_code',
      'iss_withheld',
      'iss_rate',
      'lc116_code',
      'municipal_service_code',
      'service_code',
    ]);
    await queryRunner.dropColumns('products', [
      'fiscal_is_billable',
      'fiscal_cofins_cst',
      'fiscal_pis_cst',
      'fiscal_icms_csosn',
      'fiscal_icms_cst',
      'fiscal_conversion_factor',
      'fiscal_unit_tributable',
      'fiscal_ean_tributable',
      'fiscal_ean',
      'fiscal_cfop_nfce_default',
      'fiscal_origin',
      'fiscal_cest',
      'fiscal_ncm',
    ]);
    await queryRunner.dropColumns('clients', [
      'tax_email',
      'ibge_city_code',
      'country_name',
      'country_code',
      'suframa',
      'state_taxpayer_type',
      'municipal_tax_id',
      'state_tax_id',
      'person_type',
    ]);
    await this.dropForeignKeysByColumns(queryRunner, 'clinic_settings', [
      'default_fiscal_profile_id',
    ]);
    await queryRunner.dropColumns('clinic_settings', [
      'fiscal_module_enabled',
      'default_fiscal_profile_id',
    ]);
  }

  private async dropForeignKeysByColumns(
    queryRunner: QueryRunner,
    tableName: string,
    columnNames: string[],
  ) {
    if (!columnNames.length) return;
    const table = await queryRunner.getTable(tableName);
    const foreignKeys =
      table?.foreignKeys.filter((fk) =>
        fk.columnNames.some((columnName) => columnNames.includes(columnName)),
      ) || [];
    for (const foreignKey of foreignKeys) {
      await queryRunner.dropForeignKey(tableName, foreignKey);
    }
  }
}
