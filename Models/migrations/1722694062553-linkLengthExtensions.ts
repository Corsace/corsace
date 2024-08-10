import { MigrationInterface, QueryRunner } from "typeorm";

export class LinkLengthExtensions1722694062553 implements MigrationInterface {
    name = "LinkLengthExtensions1722694062553";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`custom_beatmap\` MODIFY \`link\` varchar(512) NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` MODIFY \`link\` varchar(512) NOT NULL`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` MODIFY \`link\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`custom_beatmap\` MODIFY \`link\` varchar(255) NULL`);
    }

}
