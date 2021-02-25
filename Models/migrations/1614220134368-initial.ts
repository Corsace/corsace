import {MigrationInterface, QueryRunner} from "typeorm";

export class initial1614220134368 implements MigrationInterface {
    name = "initial1614220134368"

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `demerit_report` (`ID` int NOT NULL AUTO_INCREMENT, `reportDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `reason` longtext NULL, `amount` int NOT NULL DEFAULT '0', `userID` int NULL, PRIMARY KEY (`ID`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `user_comment` (`ID` int NOT NULL AUTO_INCREMENT, `comment` text NOT NULL, `year` year NOT NULL, `isValid` tinyint NOT NULL DEFAULT 0, `commenterID` int NOT NULL, `targetID` int NOT NULL, `lastReviewedAt` datetime NULL, `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `modeID` int NOT NULL, `reviewerID` int NULL, PRIMARY KEY (`ID`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `vote` (`ID` int NOT NULL AUTO_INCREMENT, `userID` int NULL, `beatmapsetID` int NULL, `choice` int NOT NULL, `voterID` int NOT NULL, `categoryID` int NOT NULL, PRIMARY KEY (`ID`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `beatmapset` (`ID` int NOT NULL, `artist` varchar(255) NOT NULL, `title` varchar(255) NOT NULL, `submitDate` datetime NOT NULL, `approvedDate` datetime NOT NULL, `BPM` double NOT NULL, `genre` varchar(255) NOT NULL, `language` varchar(255) NOT NULL, `favourites` int NOT NULL, `tags` longtext CHARACTER SET \"utf8mb4\" COLLATE \"utf8mb4_unicode_520_ci\" NOT NULL, `creatorID` int NULL, PRIMARY KEY (`ID`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `nomination` (`ID` int NOT NULL AUTO_INCREMENT, `isValid` tinyint NOT NULL DEFAULT 0, `lastReviewedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `nominatorID` int NOT NULL, `categoryID` int NOT NULL, `userID` int NULL, `beatmapsetID` int NULL, `reviewerID` int NULL, PRIMARY KEY (`ID`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `mca` (`year` year NOT NULL, `results` timestamp NOT NULL, `nominationStart` timestamp NOT NULL, `nominationEnd` timestamp NOT NULL, `votingStart` timestamp NOT NULL, `votingEnd` timestamp NOT NULL, PRIMARY KEY (`year`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `category` (`ID` int NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `description` varchar(255) NOT NULL, `maxNominations` int NOT NULL, `isRequired` tinyint NOT NULL DEFAULT 0, `requiresVetting` tinyint NOT NULL DEFAULT 0, `type` enum ('0', '1') NOT NULL DEFAULT '0', `modeID` int NOT NULL, `mcaYear` year NOT NULL, `filterMinlength` int NULL, `filterMaxlength` int NULL, `filterMinbpm` int NULL, `filterMaxbpm` int NULL, `filterMinsr` int NULL, `filterMaxsr` int NULL, `filterMincs` int NULL, `filterMaxcs` int NULL, `filterRookie` tinyint NULL, PRIMARY KEY (`ID`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `mode_division` (`ID` int NOT NULL, `name` varchar(255) NOT NULL, PRIMARY KEY (`ID`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `mca_eligibility` (`ID` int NOT NULL AUTO_INCREMENT, `year` year NOT NULL, `standard` tinyint NOT NULL DEFAULT 0, `taiko` tinyint NOT NULL DEFAULT 0, `fruits` tinyint NOT NULL DEFAULT 0, `mania` tinyint NOT NULL DEFAULT 0, `storyboard` tinyint NOT NULL DEFAULT 0, `userID` int NULL, PRIMARY KEY (`ID`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `username_change` (`ID` int NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `userID` int NULL, PRIMARY KEY (`ID`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `user` (`ID` int NOT NULL AUTO_INCREMENT, `registered` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `lastLogin` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `canComment` tinyint NOT NULL DEFAULT 1, `discordUserid` varchar(255) NULL DEFAULT NULL, `discordUsername` varchar(255) NOT NULL DEFAULT '', `discordAvatar` varchar(255) NOT NULL DEFAULT '', `discordAccesstoken` longtext NULL, `discordRefreshtoken` longtext NULL, `discordDateadded` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `discordLastverified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `osuUserid` varchar(255) NULL DEFAULT NULL, `osuUsername` varchar(255) NOT NULL DEFAULT '', `osuAvatar` varchar(255) NOT NULL DEFAULT '', `osuAccesstoken` longtext NULL, `osuRefreshtoken` longtext NULL, `osuDateadded` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `osuLastverified` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`ID`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `guest_request` (`ID` int NOT NULL AUTO_INCREMENT, `status` enum ('0', '1', '2') NOT NULL DEFAULT '0', `mcaYear` year NOT NULL, `modeID` int NOT NULL, `userID` int NOT NULL, `beatmapID` int NOT NULL, PRIMARY KEY (`ID`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `beatmap` (`ID` int NOT NULL, `beatmapsetID` int NOT NULL, `totalLength` int NOT NULL, `hitLength` int NOT NULL, `difficulty` varchar(255) NOT NULL, `circleSize` double NOT NULL, `overallDifficulty` double NOT NULL, `approachRate` double NOT NULL, `hpDrain` double NOT NULL, `circles` int NOT NULL, `sliders` int NOT NULL, `spinners` int NOT NULL, `rating` double NOT NULL, `storyboard` tinyint NOT NULL DEFAULT 0, `video` tinyint NOT NULL DEFAULT 0, `playCount` int NOT NULL, `passCount` int NOT NULL, `packs` varchar(255) NULL, `maxCombo` int NULL, `aimSR` double NULL, `speedSR` double NULL, `totalSR` double NOT NULL, `modeID` int NOT NULL, PRIMARY KEY (`ID`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `demerit_report` ADD CONSTRAINT `FK_8cc900fb5b596f03c0a390b6bd5` FOREIGN KEY (`userID`) REFERENCES `user`(`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `user_comment` ADD CONSTRAINT `FK_c2434e105dee00f38ab3a8a2c23` FOREIGN KEY (`modeID`) REFERENCES `mode_division`(`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `user_comment` ADD CONSTRAINT `FK_c751ec99cf574ad7d9a7cf29b43` FOREIGN KEY (`commenterID`) REFERENCES `user`(`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `user_comment` ADD CONSTRAINT `FK_0e5df3171048f9b8675f63bc4a2` FOREIGN KEY (`targetID`) REFERENCES `user`(`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `user_comment` ADD CONSTRAINT `FK_d0f131935fe2ca1499d972d1c59` FOREIGN KEY (`reviewerID`) REFERENCES `user`(`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `vote` ADD CONSTRAINT `FK_95024a2fd392e7a46d575300625` FOREIGN KEY (`voterID`) REFERENCES `user`(`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `vote` ADD CONSTRAINT `FK_3fc497d966847615971381ea9e6` FOREIGN KEY (`categoryID`) REFERENCES `category`(`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `vote` ADD CONSTRAINT `FK_9be5b576e8d5d7ed6324acef319` FOREIGN KEY (`userID`) REFERENCES `user`(`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `vote` ADD CONSTRAINT `FK_c68a9b69880189f3b1c197204d9` FOREIGN KEY (`beatmapsetID`) REFERENCES `beatmapset`(`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `beatmapset` ADD CONSTRAINT `FK_03d8487dc1b222d8b1bbb02967f` FOREIGN KEY (`creatorID`) REFERENCES `user`(`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `nomination` ADD CONSTRAINT `FK_29960f8747f6f51afcf0d5eaf76` FOREIGN KEY (`nominatorID`) REFERENCES `user`(`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `nomination` ADD CONSTRAINT `FK_fa8d45a51db9b4340ee3056e406` FOREIGN KEY (`categoryID`) REFERENCES `category`(`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `nomination` ADD CONSTRAINT `FK_6e8b61956c5d6dca51da0bf378c` FOREIGN KEY (`userID`) REFERENCES `user`(`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `nomination` ADD CONSTRAINT `FK_8903c97447d039b9a59c3cf3adb` FOREIGN KEY (`beatmapsetID`) REFERENCES `beatmapset`(`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `nomination` ADD CONSTRAINT `FK_5318fdf4c7821c855d2934e51af` FOREIGN KEY (`reviewerID`) REFERENCES `user`(`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `category` ADD CONSTRAINT `FK_33db1274ea484efbb5814311b17` FOREIGN KEY (`modeID`) REFERENCES `mode_division`(`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `category` ADD CONSTRAINT `FK_21823bc59f1ea8e2d37c7a2afb1` FOREIGN KEY (`mcaYear`) REFERENCES `mca`(`year`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `mca_eligibility` ADD CONSTRAINT `FK_f338d32f7d34062acaeb1de0b80` FOREIGN KEY (`userID`) REFERENCES `user`(`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `username_change` ADD CONSTRAINT `FK_375c55a3e9a6271ebda2623e2ca` FOREIGN KEY (`userID`) REFERENCES `user`(`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `guest_request` ADD CONSTRAINT `FK_adadd3e88f8903dd5be8846607f` FOREIGN KEY (`mcaYear`) REFERENCES `mca`(`year`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `guest_request` ADD CONSTRAINT `FK_59e4b3591b0a317497b96fde8ed` FOREIGN KEY (`modeID`) REFERENCES `mode_division`(`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `guest_request` ADD CONSTRAINT `FK_df7d7556b15d8182d969b348887` FOREIGN KEY (`userID`) REFERENCES `user`(`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `guest_request` ADD CONSTRAINT `FK_49cc0409f5dfbac9aae58b639a4` FOREIGN KEY (`beatmapID`) REFERENCES `beatmap`(`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `beatmap` ADD CONSTRAINT `FK_549c0cf19219a33a39a6c8ddd01` FOREIGN KEY (`beatmapsetID`) REFERENCES `beatmapset`(`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `beatmap` ADD CONSTRAINT `FK_28e0b8e4a1843d1037e040c8ea4` FOREIGN KEY (`modeID`) REFERENCES `mode_division`(`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("CREATE TABLE `corsace`.`query-result-cache` (`id` int NOT NULL AUTO_INCREMENT, `identifier` varchar(255) NULL, `time` bigint NOT NULL, `duration` int NOT NULL, `query` text NOT NULL, `result` text NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE `corsace`.`query-result-cache`");
        await queryRunner.query("ALTER TABLE `beatmap` DROP FOREIGN KEY `FK_28e0b8e4a1843d1037e040c8ea4`");
        await queryRunner.query("ALTER TABLE `beatmap` DROP FOREIGN KEY `FK_549c0cf19219a33a39a6c8ddd01`");
        await queryRunner.query("ALTER TABLE `guest_request` DROP FOREIGN KEY `FK_49cc0409f5dfbac9aae58b639a4`");
        await queryRunner.query("ALTER TABLE `guest_request` DROP FOREIGN KEY `FK_df7d7556b15d8182d969b348887`");
        await queryRunner.query("ALTER TABLE `guest_request` DROP FOREIGN KEY `FK_59e4b3591b0a317497b96fde8ed`");
        await queryRunner.query("ALTER TABLE `guest_request` DROP FOREIGN KEY `FK_adadd3e88f8903dd5be8846607f`");
        await queryRunner.query("ALTER TABLE `username_change` DROP FOREIGN KEY `FK_375c55a3e9a6271ebda2623e2ca`");
        await queryRunner.query("ALTER TABLE `mca_eligibility` DROP FOREIGN KEY `FK_f338d32f7d34062acaeb1de0b80`");
        await queryRunner.query("ALTER TABLE `category` DROP FOREIGN KEY `FK_21823bc59f1ea8e2d37c7a2afb1`");
        await queryRunner.query("ALTER TABLE `category` DROP FOREIGN KEY `FK_33db1274ea484efbb5814311b17`");
        await queryRunner.query("ALTER TABLE `nomination` DROP FOREIGN KEY `FK_5318fdf4c7821c855d2934e51af`");
        await queryRunner.query("ALTER TABLE `nomination` DROP FOREIGN KEY `FK_8903c97447d039b9a59c3cf3adb`");
        await queryRunner.query("ALTER TABLE `nomination` DROP FOREIGN KEY `FK_6e8b61956c5d6dca51da0bf378c`");
        await queryRunner.query("ALTER TABLE `nomination` DROP FOREIGN KEY `FK_fa8d45a51db9b4340ee3056e406`");
        await queryRunner.query("ALTER TABLE `nomination` DROP FOREIGN KEY `FK_29960f8747f6f51afcf0d5eaf76`");
        await queryRunner.query("ALTER TABLE `beatmapset` DROP FOREIGN KEY `FK_03d8487dc1b222d8b1bbb02967f`");
        await queryRunner.query("ALTER TABLE `vote` DROP FOREIGN KEY `FK_c68a9b69880189f3b1c197204d9`");
        await queryRunner.query("ALTER TABLE `vote` DROP FOREIGN KEY `FK_9be5b576e8d5d7ed6324acef319`");
        await queryRunner.query("ALTER TABLE `vote` DROP FOREIGN KEY `FK_3fc497d966847615971381ea9e6`");
        await queryRunner.query("ALTER TABLE `vote` DROP FOREIGN KEY `FK_95024a2fd392e7a46d575300625`");
        await queryRunner.query("ALTER TABLE `user_comment` DROP FOREIGN KEY `FK_d0f131935fe2ca1499d972d1c59`");
        await queryRunner.query("ALTER TABLE `user_comment` DROP FOREIGN KEY `FK_0e5df3171048f9b8675f63bc4a2`");
        await queryRunner.query("ALTER TABLE `user_comment` DROP FOREIGN KEY `FK_c751ec99cf574ad7d9a7cf29b43`");
        await queryRunner.query("ALTER TABLE `user_comment` DROP FOREIGN KEY `FK_c2434e105dee00f38ab3a8a2c23`");
        await queryRunner.query("ALTER TABLE `demerit_report` DROP FOREIGN KEY `FK_8cc900fb5b596f03c0a390b6bd5`");
        await queryRunner.query("DROP TABLE `beatmap`");
        await queryRunner.query("DROP TABLE `guest_request`");
        await queryRunner.query("DROP TABLE `user`");
        await queryRunner.query("DROP TABLE `username_change`");
        await queryRunner.query("DROP TABLE `mca_eligibility`");
        await queryRunner.query("DROP TABLE `mode_division`");
        await queryRunner.query("DROP TABLE `category`");
        await queryRunner.query("DROP TABLE `mca`");
        await queryRunner.query("DROP TABLE `nomination`");
        await queryRunner.query("DROP TABLE `beatmapset`");
        await queryRunner.query("DROP TABLE `vote`");
        await queryRunner.query("DROP TABLE `user_comment`");
        await queryRunner.query("DROP TABLE `demerit_report`");
    }

}
