import { MigrationInterface, QueryRunner } from "typeorm";

export class SchedulingDeadline1750777851446 implements MigrationInterface {
    name = "SchedulingDeadline1750777851446";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`round\` ADD \`schedulingDeadline\` datetime NULL`);
        await queryRunner.query(`ALTER TABLE \`stage\` ADD \`schedulingDeadline\` datetime NULL`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`stage\` DROP COLUMN \`schedulingDeadline\``);
        await queryRunner.query(`ALTER TABLE \`round\` DROP COLUMN \`schedulingDeadline\``);
    }

}
