import { MigrationInterface, QueryRunner } from "typeorm";

export class Matches1687046689630 implements MigrationInterface {
    name = "Matches1687046689630";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`match\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`mp\` int NULL, \`team1Score\` int NOT NULL DEFAULT '0', \`team2Score\` int NOT NULL DEFAULT '0', \`potential\` tinyint NOT NULL DEFAULT 0, \`forfeit\` tinyint NOT NULL DEFAULT 0, \`vod\` varchar(255) NULL, \`date\` datetime NOT NULL, \`roundID\` int NULL, \`stageID\` int NULL, \`team1ID\` int NULL, \`team2ID\` int NULL, \`winnerID\` int NULL, \`mapsID\` int NULL, \`refereeID\` int NULL, \`streamerID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`match_score\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`score\` int NOT NULL, \`mods\` int NOT NULL, \`misses\` int NOT NULL, \`combo\` int NOT NULL, \`accuracy\` int NOT NULL, \`fullCombo\` tinyint NOT NULL, \`fail\` tinyint NOT NULL, \`userID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`match_map\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`status\` enum ('0', '1', '2') NOT NULL DEFAULT '2', \`order\` int NOT NULL, \`team1Score\` int NULL, \`team2Score\` int NULL, \`mapID\` int NULL, \`winnerID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`match_commentators_user\` (\`matchID\` int NOT NULL, \`userID\` int NOT NULL, INDEX \`IDX_1432cb17994758641dc5126364\` (\`matchID\`), INDEX \`IDX_2b6371f5e6a23a491be129b9d0\` (\`userID\`), PRIMARY KEY (\`matchID\`, \`userID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`match_previous_matches_match\` (\`matchID_1\` int NOT NULL, \`matchID_2\` int NOT NULL, INDEX \`IDX_069abfcd2735ed2af38a4fcc51\` (\`matchID_1\`), INDEX \`IDX_db01c27fdec91c41501f983b46\` (\`matchID_2\`), PRIMARY KEY (\`matchID_1\`, \`matchID_2\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD \`warmups\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD \`mapTimer\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD \`readyTimer\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`match\` ADD CONSTRAINT \`FK_f0b23ee910a8fe24a26d32a25d4\` FOREIGN KEY (\`roundID\`) REFERENCES \`round\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`match\` ADD CONSTRAINT \`FK_14eb3e567b82ea399e5352afe9f\` FOREIGN KEY (\`stageID\`) REFERENCES \`stage\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`match\` ADD CONSTRAINT \`FK_e4ff265e0d8c3c9595989ad4c80\` FOREIGN KEY (\`team1ID\`) REFERENCES \`team\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`match\` ADD CONSTRAINT \`FK_bfff7188a16aa420145fdab11a1\` FOREIGN KEY (\`team2ID\`) REFERENCES \`team\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`match\` ADD CONSTRAINT \`FK_11d6d66ef011501312035df46ff\` FOREIGN KEY (\`winnerID\`) REFERENCES \`team\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`match\` ADD CONSTRAINT \`FK_03b2aaa1ff7521db90f7472386f\` FOREIGN KEY (\`mapsID\`) REFERENCES \`match_map\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`match\` ADD CONSTRAINT \`FK_15a67b26bb5527a818ab14ce5c7\` FOREIGN KEY (\`refereeID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`match\` ADD CONSTRAINT \`FK_2fdec8e86184066e0481e3b10ff\` FOREIGN KEY (\`streamerID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`match_score\` ADD CONSTRAINT \`FK_1b91c8a547e7f605ba6745c216a\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`match_map\` ADD CONSTRAINT \`FK_9d17c53d917d746155d4e06f785\` FOREIGN KEY (\`mapID\`) REFERENCES \`mappool_map\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`match_map\` ADD CONSTRAINT \`FK_b3520e3d92953421590fb640d9e\` FOREIGN KEY (\`winnerID\`) REFERENCES \`team\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`match_commentators_user\` ADD CONSTRAINT \`FK_1432cb17994758641dc51263641\` FOREIGN KEY (\`matchID\`) REFERENCES \`match\`(\`ID\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`match_commentators_user\` ADD CONSTRAINT \`FK_2b6371f5e6a23a491be129b9d0e\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`match_previous_matches_match\` ADD CONSTRAINT \`FK_069abfcd2735ed2af38a4fcc518\` FOREIGN KEY (\`matchID_1\`) REFERENCES \`match\`(\`ID\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`match_previous_matches_match\` ADD CONSTRAINT \`FK_db01c27fdec91c41501f983b469\` FOREIGN KEY (\`matchID_2\`) REFERENCES \`match\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE TABLE \`map_order\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`order\` int NOT NULL, \`status\` enum ('0', '1', '2') NOT NULL DEFAULT '2', \`stageID\` int NULL, \`roundID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`map_order\` ADD CONSTRAINT \`FK_4fd0088a1e312128306df40569b\` FOREIGN KEY (\`stageID\`) REFERENCES \`stage\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`map_order\` ADD CONSTRAINT \`FK_7f406e9323eca3f1d71abe4df01\` FOREIGN KEY (\`roundID\`) REFERENCES \`round\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`map_order\` DROP FOREIGN KEY \`FK_7f406e9323eca3f1d71abe4df01\``);
        await queryRunner.query(`ALTER TABLE \`map_order\` DROP FOREIGN KEY \`FK_4fd0088a1e312128306df40569b\``);
        await queryRunner.query(`DROP TABLE \`map_order\``);
        await queryRunner.query(`ALTER TABLE \`match_previous_matches_match\` DROP FOREIGN KEY \`FK_db01c27fdec91c41501f983b469\``);
        await queryRunner.query(`ALTER TABLE \`match_previous_matches_match\` DROP FOREIGN KEY \`FK_069abfcd2735ed2af38a4fcc518\``);
        await queryRunner.query(`ALTER TABLE \`match_commentators_user\` DROP FOREIGN KEY \`FK_2b6371f5e6a23a491be129b9d0e\``);
        await queryRunner.query(`ALTER TABLE \`match_commentators_user\` DROP FOREIGN KEY \`FK_1432cb17994758641dc51263641\``);
        await queryRunner.query(`ALTER TABLE \`match_map\` DROP FOREIGN KEY \`FK_b3520e3d92953421590fb640d9e\``);
        await queryRunner.query(`ALTER TABLE \`match_map\` DROP FOREIGN KEY \`FK_9d17c53d917d746155d4e06f785\``);
        await queryRunner.query(`ALTER TABLE \`match_score\` DROP FOREIGN KEY \`FK_1b91c8a547e7f605ba6745c216a\``);
        await queryRunner.query(`ALTER TABLE \`match\` DROP FOREIGN KEY \`FK_2fdec8e86184066e0481e3b10ff\``);
        await queryRunner.query(`ALTER TABLE \`match\` DROP FOREIGN KEY \`FK_15a67b26bb5527a818ab14ce5c7\``);
        await queryRunner.query(`ALTER TABLE \`match\` DROP FOREIGN KEY \`FK_03b2aaa1ff7521db90f7472386f\``);
        await queryRunner.query(`ALTER TABLE \`match\` DROP FOREIGN KEY \`FK_11d6d66ef011501312035df46ff\``);
        await queryRunner.query(`ALTER TABLE \`match\` DROP FOREIGN KEY \`FK_bfff7188a16aa420145fdab11a1\``);
        await queryRunner.query(`ALTER TABLE \`match\` DROP FOREIGN KEY \`FK_e4ff265e0d8c3c9595989ad4c80\``);
        await queryRunner.query(`ALTER TABLE \`match\` DROP FOREIGN KEY \`FK_14eb3e567b82ea399e5352afe9f\``);
        await queryRunner.query(`ALTER TABLE \`match\` DROP FOREIGN KEY \`FK_f0b23ee910a8fe24a26d32a25d4\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP COLUMN \`readyTimer\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP COLUMN \`mapTimer\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP COLUMN \`warmups\``);
        await queryRunner.query(`DROP INDEX \`IDX_db01c27fdec91c41501f983b46\` ON \`match_previous_matches_match\``);
        await queryRunner.query(`DROP INDEX \`IDX_069abfcd2735ed2af38a4fcc51\` ON \`match_previous_matches_match\``);
        await queryRunner.query(`DROP TABLE \`match_previous_matches_match\``);
        await queryRunner.query(`DROP INDEX \`IDX_2b6371f5e6a23a491be129b9d0\` ON \`match_commentators_user\``);
        await queryRunner.query(`DROP INDEX \`IDX_1432cb17994758641dc5126364\` ON \`match_commentators_user\``);
        await queryRunner.query(`DROP TABLE \`match_commentators_user\``);
        await queryRunner.query(`DROP TABLE \`match_map\``);
        await queryRunner.query(`DROP TABLE \`match_score\``);
        await queryRunner.query(`DROP TABLE \`match\``);
    }

}
