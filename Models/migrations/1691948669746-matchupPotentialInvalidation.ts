import { MigrationInterface, QueryRunner } from "typeorm";

export class MatchupPotentialInvalidation1691948669746 implements MigrationInterface {
    name = "MatchupPotentialInvalidation1691948669746";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD \`invalid\` tinyint NOT NULL DEFAULT 0`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP COLUMN \`invalid\``);
    }

}
