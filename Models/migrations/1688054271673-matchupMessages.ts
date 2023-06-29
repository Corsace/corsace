import { MigrationInterface, QueryRunner } from "typeorm";

export class MatchupMessages1688054271673 implements MigrationInterface {
    name = "MatchupMessages1688054271673";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`matchup_message\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`timestamp\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`content\` text NOT NULL, \`userID\` int NULL, \`matchupID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`matchup_message\` ADD CONSTRAINT \`FK_4ad72ce234f1cbaa9e7b924f072\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup_message\` ADD CONSTRAINT \`FK_f89aefadbe20491b32a761226d1\` FOREIGN KEY (\`matchupID\`) REFERENCES \`matchup\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`matchup_message\` DROP FOREIGN KEY \`FK_f89aefadbe20491b32a761226d1\``);
        await queryRunner.query(`ALTER TABLE \`matchup_message\` DROP FOREIGN KEY \`FK_4ad72ce234f1cbaa9e7b924f072\``);
        await queryRunner.query(`DROP TABLE \`matchup_message\``);
    }

}
