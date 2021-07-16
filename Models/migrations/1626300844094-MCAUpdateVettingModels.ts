import {MigrationInterface, QueryRunner} from "typeorm";

export class MCAUpdateVettingModels1626300844094 implements MigrationInterface {
    name = "MCAUpdateVettingModels1626300844094"

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `user_nominations_nomination` (`userID` int NOT NULL, `nominationID` int NOT NULL, INDEX `IDX_c39e90811e78d3a759f9f75e37` (`userID`), INDEX `IDX_2dc37a0c6b4f99e6e20c4903ae` (`nominationID`), PRIMARY KEY (`userID`, `nominationID`)) ENGINE=InnoDB");
        await queryRunner.query("INSERT INTO `user_nominations_nomination` (`userID`, `nominationID`) SELECT `nominatorID`, `ID` FROM `nomination`");

        await queryRunner.query("ALTER TABLE `nomination` DROP FOREIGN KEY `FK_29960f8747f6f51afcf0d5eaf76`");
        await queryRunner.query("ALTER TABLE `nomination` DROP COLUMN `nominatorID`");
        await queryRunner.query("ALTER TABLE `user_nominations_nomination` ADD CONSTRAINT `FK_c39e90811e78d3a759f9f75e37c` FOREIGN KEY (`userID`) REFERENCES `user`(`ID`) ON DELETE CASCADE ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `user_nominations_nomination` ADD CONSTRAINT `FK_2dc37a0c6b4f99e6e20c4903ae0` FOREIGN KEY (`nominationID`) REFERENCES `nomination`(`ID`) ON DELETE CASCADE ON UPDATE NO ACTION");
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user_nominations_nomination` DROP FOREIGN KEY `FK_2dc37a0c6b4f99e6e20c4903ae0`");
        await queryRunner.query("ALTER TABLE `user_nominations_nomination` DROP FOREIGN KEY `FK_c39e90811e78d3a759f9f75e37c`");
        await queryRunner.query("ALTER TABLE `nomination` ADD `nominatorID` int NOT NULL");
        await queryRunner.query("ALTER TABLE `nomination` ADD CONSTRAINT `FK_29960f8747f6f51afcf0d5eaf76` FOREIGN KEY (`nominatorID`) REFERENCES `user`(`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("DELETE FROM `nomination` WHERE ID IN (SELECT `nominationID` FROM `user_nominations_nomination`)");
        await queryRunner.query("INSERT INTO `nomination` (`nominatorID`, `ID`) SELECT `userID`, `nominationID` FROM `user_nominations_nomination`");

        await queryRunner.query("DROP INDEX `IDX_2dc37a0c6b4f99e6e20c4903ae` ON `user_nominations_nomination`");
        await queryRunner.query("DROP INDEX `IDX_c39e90811e78d3a759f9f75e37` ON `user_nominations_nomination`");
        await queryRunner.query("DROP TABLE `user_nominations_nomination`");
    }

}
