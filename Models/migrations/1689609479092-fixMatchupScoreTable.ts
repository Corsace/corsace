import { MigrationInterface, QueryRunner } from "typeorm";

export class FixMatchupScoreTable1689609479092 implements MigrationInterface {
    name = "FixMatchupScoreTable1689609479092";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`matchup_score\` MODIFY \`accuracy\` double NOT NULL`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`matchup_score\` MODIFY \`accuracy\` int NOT NULL`);
    }

}
