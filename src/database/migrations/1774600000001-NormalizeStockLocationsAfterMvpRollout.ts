import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeStockLocationsAfterMvpRollout1774600000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const stockLocationsTable = await queryRunner.getTable('stock_locations');
    if (!stockLocationsTable) {
      return;
    }

    await queryRunner.query(`
      INSERT INTO stock_locations (name, is_default, is_active, created_at, updated_at)
      SELECT 'Estoque Principal', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      WHERE NOT EXISTS (
        SELECT 1
        FROM stock_locations
      )
    `);

    await queryRunner.query(`
      INSERT INTO stock_locations (name, is_default, is_active, created_at, updated_at)
      SELECT 'Estoque Principal', false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      WHERE NOT EXISTS (
        SELECT 1
        FROM stock_locations
        WHERE LOWER(TRIM(name)) = LOWER(TRIM('Estoque Principal'))
      )
    `);

    await queryRunner.query(`
      UPDATE stock_locations
      SET is_default = false
      WHERE is_default = true
        AND is_active = false
    `);

    const defaultRows = await queryRunner.query(`
      SELECT id
      FROM stock_locations
      WHERE is_default = true
      ORDER BY
        CASE WHEN LOWER(TRIM(name)) = LOWER(TRIM('Estoque Principal')) THEN 0 ELSE 1 END,
        CASE WHEN is_active = true THEN 0 ELSE 1 END,
        id ASC
    `);

    if (defaultRows.length > 1) {
      const keepId = Number(defaultRows[0].id);
      await queryRunner.query(
        `
          UPDATE stock_locations
          SET is_default = false
          WHERE is_default = true
            AND id != $1
        `,
        [keepId],
      );
    }

    const activeDefaultRows = await queryRunner.query(`
      SELECT id
      FROM stock_locations
      WHERE is_default = true
        AND is_active = true
      ORDER BY id ASC
    `);

    if (activeDefaultRows.length === 0) {
      const preferredRows = await queryRunner.query(`
        SELECT id
        FROM stock_locations
        WHERE is_active = true
        ORDER BY
          CASE WHEN LOWER(TRIM(name)) = LOWER(TRIM('Estoque Principal')) THEN 0 ELSE 1 END,
          id ASC
        LIMIT 1
      `);

      if (preferredRows.length > 0) {
        const preferredId = Number(preferredRows[0].id);
        await queryRunner.query(
          `
            UPDATE stock_locations
            SET is_default = false
          `,
        );
        await queryRunner.query(
          `
            UPDATE stock_locations
            SET is_default = true
            WHERE id = $1
          `,
          [preferredId],
        );
      }
    }

    await queryRunner.query(`
      UPDATE stock_locations
      SET is_active = true
      WHERE is_default = true
        AND is_active = false
    `);

    const finalDefaultRows = await queryRunner.query(`
      SELECT id
      FROM stock_locations
      WHERE is_default = true
        AND is_active = true
      ORDER BY id ASC
    `);

    if (finalDefaultRows.length > 1) {
      const keepId = Number(finalDefaultRows[0].id);
      await queryRunner.query(
        `
          UPDATE stock_locations
          SET is_default = false
          WHERE is_default = true
            AND is_active = true
            AND id != $1
        `,
        [keepId],
      );
    }
  }

  public async down(): Promise<void> {}
}
