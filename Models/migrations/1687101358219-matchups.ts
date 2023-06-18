import { MigrationInterface, QueryRunner } from "typeorm";

export class Matchups1687101358219 implements MigrationInterface {
    name = "Matchups1687101358219";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`matchup\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`mp\` int NULL, \`team1Score\` int NOT NULL DEFAULT '0', \`team2Score\` int NOT NULL DEFAULT '0', \`potential\` tinyint NOT NULL DEFAULT 0, \`forfeit\` tinyint NOT NULL DEFAULT 0, \`vod\` varchar(255) NULL, \`date\` datetime NOT NULL, \`log\` mediumtext NULL, \`roundID\` int NULL, \`stageID\` int NULL, \`team1ID\` int NULL, \`team2ID\` int NULL, \`winnerID\` int NULL, \`mapsID\` int NULL, \`refereeID\` int NULL, \`streamerID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`matchup_score\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`score\` int NOT NULL, \`mods\` int NOT NULL, \`misses\` int NOT NULL, \`combo\` int NOT NULL, \`accuracy\` int NOT NULL, \`fullCombo\` tinyint NOT NULL, \`fail\` tinyint NOT NULL, \`userID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`matchup_map\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`status\` enum ('0', '1', '2') NOT NULL DEFAULT '2', \`order\` int NOT NULL, \`team1Score\` int NULL, \`team2Score\` int NULL, \`mapID\` int NULL, \`winnerID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`map_order\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`set\` int NOT NULL DEFAULT '1', \`order\` int NOT NULL, \`team\` int NOT NULL, \`status\` enum ('0', '1', '2') NOT NULL DEFAULT '2', \`stageID\` int NULL, \`roundID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`matchup_commentators_user\` (\`matchupID\` int NOT NULL, \`userID\` int NOT NULL, INDEX \`IDX_678a2104d7a479d602edfb81bc\` (\`matchupID\`), INDEX \`IDX_78f3f290b3e57bf2efd8634ce9\` (\`userID\`), PRIMARY KEY (\`matchupID\`, \`userID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`matchup_previous_matches_matchup\` (\`matchupID_1\` int NOT NULL, \`matchupID_2\` int NOT NULL, INDEX \`IDX_f12e92e1d7996775ae39f8498a\` (\`matchupID_1\`), INDEX \`IDX_c1010f5b32a96cbad3d77c8e36\` (\`matchupID_2\`), PRIMARY KEY (\`matchupID_1\`, \`matchupID_2\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`round\` ADD \`isDraft\` tinyint NULL`);
        await queryRunner.query(`ALTER TABLE \`round\` ADD \`setsBestOf\` int NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE \`round\` ADD \`bestOf\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`stage\` ADD \`isDraft\` tinyint NULL`);
        await queryRunner.query(`ALTER TABLE \`stage\` ADD \`setsBestOf\` int NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE \`stage\` ADD \`bestOf\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`stage\` ADD \`qualifierTeamChooseOrder\` tinyint NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD \`warmups\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD \`mapTimer\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD \`readyTimer\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD \`abortThreshold\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD \`teamAbortLimit\` int NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD CONSTRAINT \`FK_beb8e44f7963ac878775222f759\` FOREIGN KEY (\`roundID\`) REFERENCES \`round\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD CONSTRAINT \`FK_d182f4bb82da541534a5b52c65f\` FOREIGN KEY (\`stageID\`) REFERENCES \`stage\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD CONSTRAINT \`FK_740e5a2bf98703c74095b9b9f3b\` FOREIGN KEY (\`team1ID\`) REFERENCES \`team\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD CONSTRAINT \`FK_c6b1b20eae409a7b5c57661b3ab\` FOREIGN KEY (\`team2ID\`) REFERENCES \`team\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD CONSTRAINT \`FK_4b555f3f03bc62ecc868f45988d\` FOREIGN KEY (\`winnerID\`) REFERENCES \`team\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD CONSTRAINT \`FK_a7bb907fd76d9b75fc441c02c71\` FOREIGN KEY (\`mapsID\`) REFERENCES \`matchup_map\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD CONSTRAINT \`FK_dbd097a67b5159e673ac2e2bfc2\` FOREIGN KEY (\`refereeID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD CONSTRAINT \`FK_6dc825f0b936cc0a50a77bcc147\` FOREIGN KEY (\`streamerID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup_score\` ADD CONSTRAINT \`FK_4bb1fb8db221ad4fbc0051008e5\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup_map\` ADD CONSTRAINT \`FK_66239baa2ee06ed2f7a00e6b724\` FOREIGN KEY (\`mapID\`) REFERENCES \`mappool_map\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup_map\` ADD CONSTRAINT \`FK_eeca743e42356fb282a79137e28\` FOREIGN KEY (\`winnerID\`) REFERENCES \`team\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`map_order\` ADD CONSTRAINT \`FK_4fd0088a1e312128306df40569b\` FOREIGN KEY (\`stageID\`) REFERENCES \`stage\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`map_order\` ADD CONSTRAINT \`FK_7f406e9323eca3f1d71abe4df01\` FOREIGN KEY (\`roundID\`) REFERENCES \`round\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup_commentators_user\` ADD CONSTRAINT \`FK_678a2104d7a479d602edfb81bc5\` FOREIGN KEY (\`matchupID\`) REFERENCES \`matchup\`(\`ID\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`matchup_commentators_user\` ADD CONSTRAINT \`FK_78f3f290b3e57bf2efd8634ce9e\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup_previous_matches_matchup\` ADD CONSTRAINT \`FK_f12e92e1d7996775ae39f8498ab\` FOREIGN KEY (\`matchupID_1\`) REFERENCES \`matchup\`(\`ID\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`matchup_previous_matches_matchup\` ADD CONSTRAINT \`FK_c1010f5b32a96cbad3d77c8e363\` FOREIGN KEY (\`matchupID_2\`) REFERENCES \`matchup\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`matchup_previous_matches_matchup\` DROP FOREIGN KEY \`FK_c1010f5b32a96cbad3d77c8e363\``);
        await queryRunner.query(`ALTER TABLE \`matchup_previous_matches_matchup\` DROP FOREIGN KEY \`FK_f12e92e1d7996775ae39f8498ab\``);
        await queryRunner.query(`ALTER TABLE \`matchup_commentators_user\` DROP FOREIGN KEY \`FK_78f3f290b3e57bf2efd8634ce9e\``);
        await queryRunner.query(`ALTER TABLE \`matchup_commentators_user\` DROP FOREIGN KEY \`FK_678a2104d7a479d602edfb81bc5\``);
        await queryRunner.query(`ALTER TABLE \`map_order\` DROP FOREIGN KEY \`FK_7f406e9323eca3f1d71abe4df01\``);
        await queryRunner.query(`ALTER TABLE \`map_order\` DROP FOREIGN KEY \`FK_4fd0088a1e312128306df40569b\``);
        await queryRunner.query(`ALTER TABLE \`matchup_map\` DROP FOREIGN KEY \`FK_eeca743e42356fb282a79137e28\``);
        await queryRunner.query(`ALTER TABLE \`matchup_map\` DROP FOREIGN KEY \`FK_66239baa2ee06ed2f7a00e6b724\``);
        await queryRunner.query(`ALTER TABLE \`matchup_score\` DROP FOREIGN KEY \`FK_4bb1fb8db221ad4fbc0051008e5\``);
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP FOREIGN KEY \`FK_6dc825f0b936cc0a50a77bcc147\``);
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP FOREIGN KEY \`FK_dbd097a67b5159e673ac2e2bfc2\``);
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP FOREIGN KEY \`FK_a7bb907fd76d9b75fc441c02c71\``);
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP FOREIGN KEY \`FK_4b555f3f03bc62ecc868f45988d\``);
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP FOREIGN KEY \`FK_c6b1b20eae409a7b5c57661b3ab\``);
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP FOREIGN KEY \`FK_740e5a2bf98703c74095b9b9f3b\``);
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP FOREIGN KEY \`FK_d182f4bb82da541534a5b52c65f\``);
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP FOREIGN KEY \`FK_beb8e44f7963ac878775222f759\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP COLUMN \`teamAbortLimit\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP COLUMN \`abortThreshold\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP COLUMN \`readyTimer\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP COLUMN \`mapTimer\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP COLUMN \`warmups\``);
        await queryRunner.query(`ALTER TABLE \`stage\` DROP COLUMN \`qualifierTeamChooseOrder\``);
        await queryRunner.query(`ALTER TABLE \`stage\` DROP COLUMN \`bestOf\``);
        await queryRunner.query(`ALTER TABLE \`stage\` DROP COLUMN \`setsBestOf\``);
        await queryRunner.query(`ALTER TABLE \`stage\` DROP COLUMN \`isDraft\``);
        await queryRunner.query(`ALTER TABLE \`round\` DROP COLUMN \`bestOf\``);
        await queryRunner.query(`ALTER TABLE \`round\` DROP COLUMN \`setsBestOf\``);
        await queryRunner.query(`ALTER TABLE \`round\` DROP COLUMN \`isDraft\``);
        await queryRunner.query(`DROP INDEX \`IDX_c1010f5b32a96cbad3d77c8e36\` ON \`matchup_previous_matches_matchup\``);
        await queryRunner.query(`DROP INDEX \`IDX_f12e92e1d7996775ae39f8498a\` ON \`matchup_previous_matches_matchup\``);
        await queryRunner.query(`DROP TABLE \`matchup_previous_matches_matchup\``);
        await queryRunner.query(`DROP INDEX \`IDX_78f3f290b3e57bf2efd8634ce9\` ON \`matchup_commentators_user\``);
        await queryRunner.query(`DROP INDEX \`IDX_678a2104d7a479d602edfb81bc\` ON \`matchup_commentators_user\``);
        await queryRunner.query(`DROP TABLE \`matchup_commentators_user\``);
        await queryRunner.query(`DROP TABLE \`map_order\``);
        await queryRunner.query(`DROP TABLE \`matchup_map\``);
        await queryRunner.query(`DROP TABLE \`matchup_score\``);
        await queryRunner.query(`DROP TABLE \`matchup\``);
    }

}
