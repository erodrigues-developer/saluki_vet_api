import { DataSource } from 'typeorm';

export default abstract class UniqueSeeder {
  private datasource!: DataSource;
  private seederName!: string;

  public async execute(
    datasource: DataSource,
    seederName: string,
    callback: () => Promise<void>,
  ): Promise<void> {
    this.datasource = datasource;
    this.seederName = seederName;

    const results: string[] = await this.datasource.query(`
        SELECT name
        FROM unique_seeds
        WHERE name = '${this.seederName}'
    `);
    if (results.length > 0) {
      return;
    }
    await callback();
    await this.markAsExecuted();
  }

  private async markAsExecuted(): Promise<void> {
    await this.datasource.query(`
        INSERT INTO unique_seeds (timestamp, name)
        VALUES (${new Date().getTime()}, '${this.seederName}')
    `);
  }
}
