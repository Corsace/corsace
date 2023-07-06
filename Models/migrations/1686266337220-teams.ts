import { MigrationInterface, QueryRunner } from "typeorm";

export class Teams1686266337220 implements MigrationInterface {
    name = "Teams1686266337220";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`team_invite\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`userID\` int NULL, \`teamID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`team\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`name\` varchar(255) NOT NULL, \`abbreviation\` varchar(255) NOT NULL, \`avatarURL\` varchar(255) NULL, \`BWS\` double NOT NULL, \`rank\` double NOT NULL, \`pp\` double NOT NULL, \`managerID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`team_members_user\` (\`teamID\` int NOT NULL, \`userID\` int NOT NULL, INDEX \`IDX_6d782984f4760131301ae7b9f0\` (\`teamID\`), INDEX \`IDX_143e2ca39f50ba909668af50f5\` (\`userID\`), PRIMARY KEY (\`teamID\`, \`userID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`tournament_teams_team\` (\`tournamentID\` int NOT NULL, \`teamID\` int NOT NULL, INDEX \`IDX_a8f3907a2126473c1e63e821ab\` (\`tournamentID\`), INDEX \`IDX_2fd589c1120b1651dcf8262d1b\` (\`teamID\`), PRIMARY KEY (\`tournamentID\`, \`teamID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`team_invite\` ADD CONSTRAINT \`FK_14775f5b9172d5acf3e5467b74c\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`team_invite\` ADD CONSTRAINT \`FK_ea34840060c37877446513060b1\` FOREIGN KEY (\`teamID\`) REFERENCES \`team\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`team\` ADD CONSTRAINT \`FK_b567309778657df4f04db093279\` FOREIGN KEY (\`managerID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`team_members_user\` ADD CONSTRAINT \`FK_6d782984f4760131301ae7b9f0c\` FOREIGN KEY (\`teamID\`) REFERENCES \`team\`(\`ID\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`team_members_user\` ADD CONSTRAINT \`FK_143e2ca39f50ba909668af50f5b\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tournament_teams_team\` ADD CONSTRAINT \`FK_a8f3907a2126473c1e63e821abd\` FOREIGN KEY (\`tournamentID\`) REFERENCES \`tournament\`(\`ID\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`tournament_teams_team\` ADD CONSTRAINT \`FK_2fd589c1120b1651dcf8262d1ba\` FOREIGN KEY (\`teamID\`) REFERENCES \`team\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tournament_teams_team\` DROP FOREIGN KEY \`FK_2fd589c1120b1651dcf8262d1ba\``);
        await queryRunner.query(`ALTER TABLE \`tournament_teams_team\` DROP FOREIGN KEY \`FK_a8f3907a2126473c1e63e821abd\``);
        await queryRunner.query(`ALTER TABLE \`team_members_user\` DROP FOREIGN KEY \`FK_143e2ca39f50ba909668af50f5b\``);
        await queryRunner.query(`ALTER TABLE \`team_members_user\` DROP FOREIGN KEY \`FK_6d782984f4760131301ae7b9f0c\``);
        await queryRunner.query(`ALTER TABLE \`team\` DROP FOREIGN KEY \`FK_b567309778657df4f04db093279\``);
        await queryRunner.query(`ALTER TABLE \`team_invite\` DROP FOREIGN KEY \`FK_ea34840060c37877446513060b1\``);
        await queryRunner.query(`ALTER TABLE \`team_invite\` DROP FOREIGN KEY \`FK_14775f5b9172d5acf3e5467b74c\``);
        await queryRunner.query(`DROP INDEX \`IDX_2fd589c1120b1651dcf8262d1b\` ON \`tournament_teams_team\``);
        await queryRunner.query(`DROP INDEX \`IDX_a8f3907a2126473c1e63e821ab\` ON \`tournament_teams_team\``);
        await queryRunner.query(`DROP TABLE \`tournament_teams_team\``);
        await queryRunner.query(`DROP INDEX \`IDX_143e2ca39f50ba909668af50f5\` ON \`team_members_user\``);
        await queryRunner.query(`DROP INDEX \`IDX_6d782984f4760131301ae7b9f0\` ON \`team_members_user\``);
        await queryRunner.query(`DROP TABLE \`team_members_user\``);
        await queryRunner.query(`DROP TABLE \`team\``);
        await queryRunner.query(`DROP TABLE \`team_invite\``);
    }

}
