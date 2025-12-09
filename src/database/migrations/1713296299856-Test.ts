import { MigrationInterface, QueryRunner } from "typeorm";

export class Test1713296299856 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('test migration');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
