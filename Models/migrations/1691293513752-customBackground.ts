import { MigrationInterface, QueryRunner } from "typeorm";

export class CustomBackground1691293513752 implements MigrationInterface {
    name = "CustomBackground1691293513752";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`custom_beatmap\` ADD \`background\` varchar(255) NULL`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`custom_beatmap\` DROP COLUMN \`background\``);
    }

}
