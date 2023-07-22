import { MigrationInterface, QueryRunner } from "typeorm";

export class MatchupIP1690048961020 implements MigrationInterface {
    name = "MatchupIP1690048961020";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD \`ip\` varchar(15) NULL`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP COLUMN \`ip\``);
    }

}
