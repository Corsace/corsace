import { MigrationInterface, QueryRunner } from "typeorm";

export class tournamentMigration1674416657733 implements MigrationInterface {
    name = "tournamentMigration1674416657733";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`mappool_map_history\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`link\` varchar(255) NOT NULL, \`mappoolMapID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`mappool_map\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`lastUpdate\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(), \`isCustom\` tinyint NOT NULL DEFAULT 0, \`link\` varchar(255) NULL, \`slotID\` int NULL, \`beatmapID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`mappool_slot\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`acronym\` varchar(255) NOT NULL, \`allowedMods\` int NULL, \`mappoolID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`mappool\` (\`ID\` int NOT NULL AUTO_INCREMENT, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`round\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`stageID\` int NULL, \`mappoolID\` int NULL, UNIQUE INDEX \`REL_f7f484d2b35282d175a3ec615b\` (\`mappoolID\`), PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`stage\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`name\` varchar(255) NOT NULL, \`order\` int NOT NULL, \`stageType\` enum ('0', '1', '2', '3', '4') NOT NULL DEFAULT '2', \`scoringMethod\` enum ('0', '1', '2', '3', '4', '5', '6', '7') NOT NULL DEFAULT '1', \`isFinished\` tinyint NOT NULL DEFAULT 0, \`initialSize\` int NOT NULL, \`finalSize\` int NOT NULL, \`tournamentID\` int NULL, \`mappoolID\` int NULL, \`timespanStart\` timestamp NOT NULL, \`timespanEnd\` timestamp NOT NULL, UNIQUE INDEX \`REL_b279168d04de196539f22fe66e\` (\`mappoolID\`), PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`tournament\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NOT NULL, \`server\` varchar(255) NOT NULL, \`year\` year NOT NULL, \`matchSize\` int NOT NULL, \`regSortOrder\` enum ('0', '1', '2', '3') NOT NULL DEFAULT '0', \`isOpen\` tinyint NOT NULL DEFAULT 0, \`isClosed\` tinyint NOT NULL DEFAULT 0, \`invitational\` tinyint NOT NULL DEFAULT 0, \`minTeamSize\` int NOT NULL, \`maxTeamSize\` int NOT NULL, \`publicQualifiers\` tinyint NOT NULL DEFAULT 0, \`status\` enum ('0', '1', '2', '3') NOT NULL DEFAULT '0', \`organizerID\` int NULL, \`modeID\` int NULL, \`registrationsStart\` timestamp NOT NULL, \`registrationsEnd\` timestamp NOT NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_history\` ADD CONSTRAINT \`FK_4d71cb55c73a73e235eaa941a02\` FOREIGN KEY (\`mappoolMapID\`) REFERENCES \`mappool_map\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` ADD CONSTRAINT \`FK_e0fd6bfacfd88cbd77e4983689d\` FOREIGN KEY (\`slotID\`) REFERENCES \`mappool_slot\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` ADD CONSTRAINT \`FK_765b31ee40f1084971908109359\` FOREIGN KEY (\`beatmapID\`) REFERENCES \`beatmap\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_slot\` ADD CONSTRAINT \`FK_db1501100e2089e602531eb050b\` FOREIGN KEY (\`mappoolID\`) REFERENCES \`mappool\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`round\` ADD CONSTRAINT \`FK_d1a278fd1c02d08ffb984189af0\` FOREIGN KEY (\`stageID\`) REFERENCES \`stage\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`round\` ADD CONSTRAINT \`FK_f7f484d2b35282d175a3ec615b6\` FOREIGN KEY (\`mappoolID\`) REFERENCES \`mappool\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`stage\` ADD CONSTRAINT \`FK_40a84786ce719424b15ab38e9c7\` FOREIGN KEY (\`tournamentID\`) REFERENCES \`tournament\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`stage\` ADD CONSTRAINT \`FK_b279168d04de196539f22fe66ea\` FOREIGN KEY (\`mappoolID\`) REFERENCES \`mappool\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD CONSTRAINT \`FK_d837b180632c18af2322e473866\` FOREIGN KEY (\`organizerID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD CONSTRAINT \`FK_455742ff36fcbce4559734de6c0\` FOREIGN KEY (\`modeID\`) REFERENCES \`mode_division\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP FOREIGN KEY \`FK_455742ff36fcbce4559734de6c0\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP FOREIGN KEY \`FK_d837b180632c18af2322e473866\``);
        await queryRunner.query(`ALTER TABLE \`stage\` DROP FOREIGN KEY \`FK_b279168d04de196539f22fe66ea\``);
        await queryRunner.query(`ALTER TABLE \`stage\` DROP FOREIGN KEY \`FK_40a84786ce719424b15ab38e9c7\``);
        await queryRunner.query(`ALTER TABLE \`round\` DROP FOREIGN KEY \`FK_f7f484d2b35282d175a3ec615b6\``);
        await queryRunner.query(`ALTER TABLE \`round\` DROP FOREIGN KEY \`FK_d1a278fd1c02d08ffb984189af0\``);
        await queryRunner.query(`ALTER TABLE \`mappool_slot\` DROP FOREIGN KEY \`FK_db1501100e2089e602531eb050b\``);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` DROP FOREIGN KEY \`FK_765b31ee40f1084971908109359\``);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` DROP FOREIGN KEY \`FK_e0fd6bfacfd88cbd77e4983689d\``);
        await queryRunner.query(`ALTER TABLE \`mappool_map_history\` DROP FOREIGN KEY \`FK_4d71cb55c73a73e235eaa941a02\``);
        await queryRunner.query(`DROP TABLE \`tournament\``);
        await queryRunner.query(`DROP INDEX \`REL_b279168d04de196539f22fe66e\` ON \`stage\``);
        await queryRunner.query(`DROP TABLE \`stage\``);
        await queryRunner.query(`DROP INDEX \`REL_f7f484d2b35282d175a3ec615b\` ON \`round\``);
        await queryRunner.query(`DROP TABLE \`round\``);
        await queryRunner.query(`DROP TABLE \`mappool\``);
        await queryRunner.query(`DROP TABLE \`mappool_slot\``);
        await queryRunner.query(`DROP TABLE \`mappool_map\``);
        await queryRunner.query(`DROP TABLE \`mappool_map_history\``);
    }

}
