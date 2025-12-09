import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SeederOptions, runSeeders } from 'typeorm-extension';
import TestSeeder from './seeds/test.seeder';
import ClientsSeeder from './seeds/clients.seeder';
dotenv.config();

const options: DataSourceOptions & SeederOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'postgres_template_api',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'template',
  synchronize: false,
  entities: ['src/modules/**/entities/*.entity{.ts,.js}'],
  logging: process.env.DB_LOG == 'true' ? true : false,
  migrations: ['src/database/migrations/*.ts'],
  seeds: [ClientsSeeder, TestSeeder],
};

const datasource = new DataSource(options);
export default datasource;
