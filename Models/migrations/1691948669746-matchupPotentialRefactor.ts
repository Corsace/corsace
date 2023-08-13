import { MigrationInterface, QueryRunner } from "typeorm";

export class MatchupPotentialRefactor1691948669746 implements MigrationInterface {
    name = "MatchupPotentialRefactor1691948669746";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD \`invalid\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP COLUMN \`potential\``);
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD \`potentialForID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD CONSTRAINT \`FK_446921d6c1e857e27c148344890\` FOREIGN KEY (\`potentialForID\`) REFERENCES \`matchup\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP FOREIGN KEY \`FK_446921d6c1e857e27c148344890\``);
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP COLUMN \`potentialForID\``);
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD \`potential\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP COLUMN \`invalid\``);
    }

}
