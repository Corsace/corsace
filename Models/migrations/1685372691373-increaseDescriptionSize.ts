import { MigrationInterface, QueryRunner } from "typeorm";

export class increaseDescrptionSize1685372691373 implements MigrationInterface {
    name = "increaseDescrptionSize1685372691373";

    public async up (queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`ALTER TABLE \`job_post\` MODIFY \`description\` TEXT NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament\` MODIFY \`description\` TEXT NOT NULL`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`ALTER TABLE \`job_post\` MODIFY \`description\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament\` MODIFY \`description\` varchar(255) NOT NULL`);
    }
}
