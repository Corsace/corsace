import { MigrationInterface, QueryRunner } from "typeorm";

export class MatchIDLabels1722799758998 implements MigrationInterface {
    name = "MatchIDLabels1722799758998";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD \`matchID\` varchar(255) NOT NULL DEFAULT ''`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP COLUMN \`matchID\``);
    }

}
