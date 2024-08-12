import { MigrationInterface, QueryRunner } from "typeorm";

export class MatchupConnectionChanges1723429054291 implements MigrationInterface {
    name = "MatchupConnectionChanges1723429054291";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD \`loserNextMatchupID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD \`winnerNextMatchupID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD CONSTRAINT \`FK_04b07f127ba49bcc5a1804d951e\` FOREIGN KEY (\`loserNextMatchupID\`) REFERENCES \`matchup\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD CONSTRAINT \`FK_1153441e3dcc4503cb04115af00\` FOREIGN KEY (\`winnerNextMatchupID\`) REFERENCES \`matchup\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP FOREIGN KEY \`FK_1153441e3dcc4503cb04115af00\``);
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP FOREIGN KEY \`FK_04b07f127ba49bcc5a1804d951e\``);
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP COLUMN \`winnerNextMatchupID\``);
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP COLUMN \`loserNextMatchupID\``);
    }

}
