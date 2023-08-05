import { MigrationInterface, QueryRunner } from "typeorm";

export class TournamentKey1691197372606 implements MigrationInterface {
    name = "TournamentKey1691197372606";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`tournament_key\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`key\` varchar(128) NOT NULL, UNIQUE INDEX \`IDX_bf55505ca990f9abc1c2cab402\` (\`key\`), PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD \`keyID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD UNIQUE INDEX \`IDX_8d016e530730723725d0d289cc\` (\`keyID\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_8d016e530730723725d0d289cc\` ON \`tournament\` (\`keyID\`)`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD CONSTRAINT \`FK_8d016e530730723725d0d289cca\` FOREIGN KEY (\`keyID\`) REFERENCES \`tournament_key\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP FOREIGN KEY \`FK_8d016e530730723725d0d289cca\``);
        await queryRunner.query(`DROP INDEX \`REL_8d016e530730723725d0d289cc\` ON \`tournament\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP INDEX \`IDX_8d016e530730723725d0d289cc\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP COLUMN \`keyID\``);
        await queryRunner.query(`DROP INDEX \`IDX_bf55505ca990f9abc1c2cab402\` ON \`tournament_key\``);
        await queryRunner.query(`DROP TABLE \`tournament_key\``);
    }

}
