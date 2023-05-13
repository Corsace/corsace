import { MigrationInterface, QueryRunner } from "typeorm";

export class mappacks1683937326816 implements MigrationInterface {
    name = "mappacks1683937326816";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`mappool\` ADD \`s3Key\` varchar(255) NULL, ADD \`link\` varchar(255) NULL, ADD \`linkExpiry\` datetime NULL`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`mappool\` DROP COLUMN \`s3Key\`, DROP COLUMN \`link\`, DROP COLUMN \`linkExpiry\``);
    }

}
