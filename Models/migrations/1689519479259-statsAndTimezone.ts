import { MigrationInterface, QueryRunner } from "typeorm";
import { Team } from "../tournaments/team";

export class StatsAndTimezone1689519479259 implements MigrationInterface {
    name = "StatsAndTimezone1689519479259";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`user_statistics\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`BWS\` double NOT NULL DEFAULT '0', \`rank\` double NOT NULL DEFAULT '0', \`pp\` double NOT NULL DEFAULT '0', \`lastVerified\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP(), \`modeDivisionID\` int NULL, \`userID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`team\` ADD \`timezoneOffset\` int NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`user_statistics\` ADD CONSTRAINT \`FK_09b61b49529146fc1572abbc550\` FOREIGN KEY (\`modeDivisionID\`) REFERENCES \`mode_division\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_statistics\` ADD CONSTRAINT \`FK_fe8512e6f7cfc1589a44a72a82f\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        
        const teams = await Team
            .createQueryBuilder("team")
            .leftJoinAndSelect("team.members", "member")
            .getMany();
        
        await Promise.all(teams.map(async team => {
            await team.calculateStats();
            await team.save();
        }));
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_statistics\` DROP FOREIGN KEY \`FK_fe8512e6f7cfc1589a44a72a82f\``);
        await queryRunner.query(`ALTER TABLE \`user_statistics\` DROP FOREIGN KEY \`FK_09b61b49529146fc1572abbc550\``);
        await queryRunner.query(`ALTER TABLE \`team\` DROP COLUMN \`timezoneOffset\``);
        await queryRunner.query(`DROP TABLE \`user_statistics\``);
    }

}
