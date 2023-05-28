import { MigrationInterface, QueryRunner } from "typeorm";

export class mappacks1683937326816 implements MigrationInterface {
    name = "mappacks1683937326816";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`mappool\` ADD \`mappackLink\` text NULL, ADD \`mappackExpiry\` datetime NULL`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`mappool\` DROP COLUMN \`mappackLink\`, DROP COLUMN \`mappackExpiry\``);
    }

}
