import { MigrationInterface, QueryRunner } from "typeorm";

export class tournamentMigration1677546671199 implements MigrationInterface {
    name = 'tournamentMigration1677546671199'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`mappool_map_history\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`link\` varchar(255) NOT NULL, \`mappoolMapID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`mappool_map_skill\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`rating\` int NOT NULL, \`skill\` enum ('0', '1', '2', '3', '4', '5', '6', '7', '8') NOT NULL, \`userID\` int NULL, \`mappoolMapID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`mappool_map_weight\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`weight\` int NOT NULL, \`skill\` enum ('0', '1', '2', '3', '4', '5', '6', '7', '8') NOT NULL, \`userID\` int NULL, \`mappoolMapID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`mappool_map\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`lastUpdate\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(), \`order\` int NOT NULL, \`isCustom\` tinyint NOT NULL DEFAULT 0, \`deadline\` datetime NULL, \`link\` varchar(255) NULL, \`slotID\` int NULL, \`beatmapID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`mappool_slot\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`acronym\` varchar(255) NOT NULL, \`colour\` varchar(255) NULL, \`allowedMods\` int NULL, \`mappoolID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`mappool\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`targetSR\` int NOT NULL, \`order\` int NOT NULL, \`stageID\` int NULL, \`roundID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`round\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`abbreviation\` varchar(255) NOT NULL, \`stageID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`stage\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`name\` varchar(255) NOT NULL, \`abbreviation\` varchar(255) NOT NULL, \`order\` int NOT NULL, \`stageType\` enum ('0', '1', '2', '3', '4') NOT NULL DEFAULT '2', \`scoringMethod\` enum ('0', '1', '2', '3', '4', '5', '6', '7') NOT NULL DEFAULT '1', \`isFinished\` tinyint NOT NULL DEFAULT 0, \`initialSize\` int NOT NULL, \`finalSize\` int NOT NULL, \`tournamentID\` int NULL, \`timespanStart\` timestamp NOT NULL, \`timespanEnd\` timestamp NOT NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`tournament_channel\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`channelID\` varchar(255) NOT NULL, \`channelType\` enum ('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11') NOT NULL DEFAULT '0', \`tournamentID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`tournament_role\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`roleID\` varchar(255) NOT NULL, \`roleType\` enum ('0', '1', '2', '3', '4', '5', '6', '7', '8') NOT NULL, \`tournamentID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`tournament\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`name\` varchar(255) NOT NULL, \`abbreviation\` varchar(255) NOT NULL, \`description\` varchar(255) NOT NULL, \`server\` varchar(255) NOT NULL, \`year\` year NOT NULL, \`matchSize\` int NOT NULL, \`regSortOrder\` enum ('0', '1', '2', '3') NOT NULL DEFAULT '0', \`isOpen\` tinyint NOT NULL DEFAULT 0, \`isClosed\` tinyint NOT NULL DEFAULT 0, \`invitational\` tinyint NOT NULL DEFAULT 0, \`minTeamSize\` int NOT NULL, \`maxTeamSize\` int NOT NULL, \`publicQualifiers\` tinyint NOT NULL DEFAULT 0, \`status\` enum ('0', '1', '2', '3') NOT NULL DEFAULT '0', \`organizerID\` int NULL, \`modeID\` int NULL, \`registrationsStart\` timestamp NOT NULL, \`registrationsEnd\` timestamp NOT NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`mappool_map_custom_mappers_user\` (\`mappoolMapID\` int NOT NULL, \`userID\` int NOT NULL, INDEX \`IDX_dbc2f0c81e7df807af9393ef6f\` (\`mappoolMapID\`), INDEX \`IDX_3fdb2430069bc36ddfed9281b8\` (\`userID\`), PRIMARY KEY (\`mappoolMapID\`, \`userID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_history\` ADD CONSTRAINT \`FK_4d71cb55c73a73e235eaa941a02\` FOREIGN KEY (\`mappoolMapID\`) REFERENCES \`mappool_map\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_skill\` ADD CONSTRAINT \`FK_0822af5af607323fcae9a3a8b01\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_skill\` ADD CONSTRAINT \`FK_40c169a892e09dd925312b5d3ed\` FOREIGN KEY (\`mappoolMapID\`) REFERENCES \`mappool_map\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_weight\` ADD CONSTRAINT \`FK_451d2d1f81dc355dcf49f3839f5\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_weight\` ADD CONSTRAINT \`FK_0e04c219d2aaed067c03f3eb405\` FOREIGN KEY (\`mappoolMapID\`) REFERENCES \`mappool_map\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` ADD CONSTRAINT \`FK_e0fd6bfacfd88cbd77e4983689d\` FOREIGN KEY (\`slotID\`) REFERENCES \`mappool_slot\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` ADD CONSTRAINT \`FK_765b31ee40f1084971908109359\` FOREIGN KEY (\`beatmapID\`) REFERENCES \`beatmap\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_slot\` ADD CONSTRAINT \`FK_db1501100e2089e602531eb050b\` FOREIGN KEY (\`mappoolID\`) REFERENCES \`mappool\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool\` ADD CONSTRAINT \`FK_1542f1d5547fb8e2142309fbcf8\` FOREIGN KEY (\`stageID\`) REFERENCES \`stage\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool\` ADD CONSTRAINT \`FK_f551a91a9c1a906a0c5937ac3ab\` FOREIGN KEY (\`roundID\`) REFERENCES \`round\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`round\` ADD CONSTRAINT \`FK_d1a278fd1c02d08ffb984189af0\` FOREIGN KEY (\`stageID\`) REFERENCES \`stage\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`stage\` ADD CONSTRAINT \`FK_40a84786ce719424b15ab38e9c7\` FOREIGN KEY (\`tournamentID\`) REFERENCES \`tournament\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tournament_channel\` ADD CONSTRAINT \`FK_ea3314cdbf262c321984d9c16a0\` FOREIGN KEY (\`tournamentID\`) REFERENCES \`tournament\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tournament_role\` ADD CONSTRAINT \`FK_6e42fb6285926f58915731a9476\` FOREIGN KEY (\`tournamentID\`) REFERENCES \`tournament\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD CONSTRAINT \`FK_d837b180632c18af2322e473866\` FOREIGN KEY (\`organizerID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD CONSTRAINT \`FK_455742ff36fcbce4559734de6c0\` FOREIGN KEY (\`modeID\`) REFERENCES \`mode_division\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_custom_mappers_user\` ADD CONSTRAINT \`FK_dbc2f0c81e7df807af9393ef6fe\` FOREIGN KEY (\`mappoolMapID\`) REFERENCES \`mappool_map\`(\`ID\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_custom_mappers_user\` ADD CONSTRAINT \`FK_3fdb2430069bc36ddfed9281b82\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`mappool_map_custom_mappers_user\` DROP FOREIGN KEY \`FK_3fdb2430069bc36ddfed9281b82\``);
        await queryRunner.query(`ALTER TABLE \`mappool_map_custom_mappers_user\` DROP FOREIGN KEY \`FK_dbc2f0c81e7df807af9393ef6fe\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP FOREIGN KEY \`FK_455742ff36fcbce4559734de6c0\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP FOREIGN KEY \`FK_d837b180632c18af2322e473866\``);
        await queryRunner.query(`ALTER TABLE \`tournament_role\` DROP FOREIGN KEY \`FK_6e42fb6285926f58915731a9476\``);
        await queryRunner.query(`ALTER TABLE \`tournament_channel\` DROP FOREIGN KEY \`FK_ea3314cdbf262c321984d9c16a0\``);
        await queryRunner.query(`ALTER TABLE \`stage\` DROP FOREIGN KEY \`FK_40a84786ce719424b15ab38e9c7\``);
        await queryRunner.query(`ALTER TABLE \`round\` DROP FOREIGN KEY \`FK_d1a278fd1c02d08ffb984189af0\``);
        await queryRunner.query(`ALTER TABLE \`mappool\` DROP FOREIGN KEY \`FK_f551a91a9c1a906a0c5937ac3ab\``);
        await queryRunner.query(`ALTER TABLE \`mappool\` DROP FOREIGN KEY \`FK_1542f1d5547fb8e2142309fbcf8\``);
        await queryRunner.query(`ALTER TABLE \`mappool_slot\` DROP FOREIGN KEY \`FK_db1501100e2089e602531eb050b\``);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` DROP FOREIGN KEY \`FK_765b31ee40f1084971908109359\``);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` DROP FOREIGN KEY \`FK_e0fd6bfacfd88cbd77e4983689d\``);
        await queryRunner.query(`ALTER TABLE \`mappool_map_weight\` DROP FOREIGN KEY \`FK_0e04c219d2aaed067c03f3eb405\``);
        await queryRunner.query(`ALTER TABLE \`mappool_map_weight\` DROP FOREIGN KEY \`FK_451d2d1f81dc355dcf49f3839f5\``);
        await queryRunner.query(`ALTER TABLE \`mappool_map_skill\` DROP FOREIGN KEY \`FK_40c169a892e09dd925312b5d3ed\``);
        await queryRunner.query(`ALTER TABLE \`mappool_map_skill\` DROP FOREIGN KEY \`FK_0822af5af607323fcae9a3a8b01\``);
        await queryRunner.query(`ALTER TABLE \`mappool_map_history\` DROP FOREIGN KEY \`FK_4d71cb55c73a73e235eaa941a02\``);
        await queryRunner.query(`DROP INDEX \`IDX_3fdb2430069bc36ddfed9281b8\` ON \`mappool_map_custom_mappers_user\``);
        await queryRunner.query(`DROP INDEX \`IDX_dbc2f0c81e7df807af9393ef6f\` ON \`mappool_map_custom_mappers_user\``);
        await queryRunner.query(`DROP TABLE \`mappool_map_custom_mappers_user\``);
        await queryRunner.query(`DROP TABLE \`tournament\``);
        await queryRunner.query(`DROP TABLE \`tournament_role\``);
        await queryRunner.query(`DROP TABLE \`tournament_channel\``);
        await queryRunner.query(`DROP TABLE \`stage\``);
        await queryRunner.query(`DROP TABLE \`round\``);
        await queryRunner.query(`DROP TABLE \`mappool\``);
        await queryRunner.query(`DROP TABLE \`mappool_slot\``);
        await queryRunner.query(`DROP TABLE \`mappool_map\``);
        await queryRunner.query(`DROP TABLE \`mappool_map_weight\``);
        await queryRunner.query(`DROP TABLE \`mappool_map_skill\``);
        await queryRunner.query(`DROP TABLE \`mappool_map_history\``);
    }

}
