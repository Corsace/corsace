import { MigrationInterface, QueryRunner } from "typeorm";

export class StageBestOfRemoval1692375873818 implements MigrationInterface {
    name = "StageBestOfRemoval1692375873818";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`round\` DROP COLUMN \`setsBestOf\``);
        await queryRunner.query(`ALTER TABLE \`round\` DROP COLUMN \`bestOf\``);
        await queryRunner.query(`ALTER TABLE \`stage\` DROP COLUMN \`setsBestOf\``);
        await queryRunner.query(`ALTER TABLE \`stage\` DROP COLUMN \`bestOf\``);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`stage\` ADD \`bestOf\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`stage\` ADD \`setsBestOf\` int NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE \`round\` ADD \`bestOf\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`round\` ADD \`setsBestOf\` int NOT NULL DEFAULT 1`);
    }

}
