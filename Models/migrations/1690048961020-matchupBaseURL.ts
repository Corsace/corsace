import { MigrationInterface, QueryRunner } from "typeorm";

export class MatchupBaseURL1690048961020 implements MigrationInterface {
    name = "MatchupBaseURL1690048961020";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD \`baseURL\` varchar(28) NULL`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP COLUMN \`baseURL\``);
    }

}
