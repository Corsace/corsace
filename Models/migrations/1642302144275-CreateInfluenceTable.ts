import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateInfluenceTable1642302144275 implements MigrationInterface {
    name = 'CreateInfluenceTable1642302144275'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`influence\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`userID\` int NOT NULL, \`influenceID\` int NOT NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`influence\` ADD CONSTRAINT \`FK_feddb1198a3f7fd89dd8207e7f6\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`influence\` ADD CONSTRAINT \`FK_3d99ed61b7beae928a1935202e3\` FOREIGN KEY (\`influenceID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`influence\` DROP FOREIGN KEY \`FK_3d99ed61b7beae928a1935202e3\``);
        await queryRunner.query(`ALTER TABLE \`influence\` DROP FOREIGN KEY \`FK_feddb1198a3f7fd89dd8207e7f6\``);
        await queryRunner.query(`DROP TABLE \`influence\``);
    }

}
