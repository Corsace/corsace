import { MigrationInterface, QueryRunner } from "typeorm";

export class MatchupConnectionChanges1723420602417 implements MigrationInterface {
    name = "MatchupConnectionChanges1723420602417";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD \`loserNextMatchupID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD UNIQUE INDEX \`IDX_04b07f127ba49bcc5a1804d951\` (\`loserNextMatchupID\`)`);
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD \`winnerNextMatchupID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD UNIQUE INDEX \`IDX_1153441e3dcc4503cb04115af0\` (\`winnerNextMatchupID\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_04b07f127ba49bcc5a1804d951\` ON \`matchup\` (\`loserNextMatchupID\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_1153441e3dcc4503cb04115af0\` ON \`matchup\` (\`winnerNextMatchupID\`)`);
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD CONSTRAINT \`FK_04b07f127ba49bcc5a1804d951e\` FOREIGN KEY (\`loserNextMatchupID\`) REFERENCES \`matchup\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD CONSTRAINT \`FK_1153441e3dcc4503cb04115af00\` FOREIGN KEY (\`winnerNextMatchupID\`) REFERENCES \`matchup\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP FOREIGN KEY \`FK_1153441e3dcc4503cb04115af00\``);
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP FOREIGN KEY \`FK_04b07f127ba49bcc5a1804d951e\``);
        await queryRunner.query(`DROP INDEX \`REL_1153441e3dcc4503cb04115af0\` ON \`matchup\``);
        await queryRunner.query(`DROP INDEX \`REL_04b07f127ba49bcc5a1804d951\` ON \`matchup\``);
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP INDEX \`IDX_1153441e3dcc4503cb04115af0\``);
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP COLUMN \`winnerNextMatchupID\``);
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP INDEX \`IDX_04b07f127ba49bcc5a1804d951\``);
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP COLUMN \`loserNextMatchupID\``);
    }

}
