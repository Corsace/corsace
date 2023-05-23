import { MigrationInterface, QueryRunner } from "typeorm";

export class nullableApprovedDate1684865700565 implements MigrationInterface {
    name = "nullableApprovedDate1684865700565";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`beatmapset\` CHANGE \`approvedDate\` \`approvedDate\` datetime NULL`);
        await queryRunner.query(`ALTER TABLE \`beatmapset\` ADD \`rankedStatus\` enum ('-2', '-1', '0', '1', '2', '3', '4') NOT NULL`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`beatmapset\` DROP COLUMN \`rankedStatus\``);
        await queryRunner.query(`ALTER TABLE \`beatmapset\` CHANGE \`approvedDate\` \`approvedDate\` datetime NOT NULL`);
    }

}
