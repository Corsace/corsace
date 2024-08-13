import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveMapTeamScores1723568303334 implements MigrationInterface {
    name = "RemoveMapTeamScores1723568303334";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`matchup_map\` DROP COLUMN \`team1Score\``);
        await queryRunner.query(`ALTER TABLE \`matchup_map\` DROP COLUMN \`team2Score\``);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`matchup_map\` ADD \`team2Score\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`matchup_map\` ADD \`team1Score\` int NULL`);
    }

}
