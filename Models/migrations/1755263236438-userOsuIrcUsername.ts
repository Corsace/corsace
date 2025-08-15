import { MigrationInterface, QueryRunner } from "typeorm";

export class UserOsuIrcUsername1755263236438 implements MigrationInterface {
    name = "UserOsuIrcUsername1755263236438";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`osuIrcusername\` varchar(255) AS (REPLACE(osuUsername, ' ', '_')) VIRTUAL`);
        await queryRunner.query(`INSERT INTO \`corsace\`.\`typeorm_metadata\`(\`database\`, \`schema\`, \`table\`, \`type\`, \`name\`, \`value\`) VALUES (DEFAULT, ?, ?, ?, ?, ?)`, ["corsace","user","GENERATED_COLUMN","osuIrcusername","REPLACE(osuUsername, ' ', '_')"]);
        await queryRunner.query(`CREATE INDEX \`IDX_8e9042f60bc5bd1771ad10ef3c\` ON \`user\` (\`osuIrcusername\`)`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_8e9042f60bc5bd1771ad10ef3c\` ON \`user\``);
        await queryRunner.query(`DELETE FROM \`corsace\`.\`typeorm_metadata\` WHERE \`type\` = ? AND \`name\` = ? AND \`schema\` = ? AND \`table\` = ?`, ["GENERATED_COLUMN","osuIrcusername","corsace","user"]);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`osuIrcusername\``);
    }

}
