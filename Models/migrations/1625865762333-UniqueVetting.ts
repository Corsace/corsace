import {MigrationInterface, QueryRunner} from "typeorm";

export class UniqueVetting1625865762333 implements MigrationInterface {
    name = "UniqueVetting1625865762333"

    public async up (queryRunner: QueryRunner): Promise<void> {
        // Backup nominations
        await queryRunner.dropTable("nomination_backup", true, true, true);
        await queryRunner.query("CREATE TABLE `nomination_backup` SELECT * FROM `nomination`");

        await queryRunner.query("CREATE TABLE `user_nominations_nomination` (`userID` int NOT NULL, `nominationID` int NOT NULL, INDEX `IDX_c39e90811e78d3a759f9f75e37` (`userID`), INDEX `IDX_2dc37a0c6b4f99e6e20c4903ae` (`nominationID`), PRIMARY KEY (`userID`, `nominationID`)) ENGINE=InnoDB");
        // Copy data, not the ideal way but w/e
        await queryRunner.query("INSERT INTO `user_nominations_nomination` (`userID`, `nominationID`) SELECT `nominatorID`, `ID` FROM `nomination`");
        
        await queryRunner.dropForeignKey("nomination", "FK_29960f8747f6f51afcf0d5eaf76");
        await queryRunner.dropColumn("nomination", "nominatorID");
        await queryRunner.query("ALTER TABLE `user_nominations_nomination` ADD CONSTRAINT `FK_c39e90811e78d3a759f9f75e37c` FOREIGN KEY (`userID`) REFERENCES `user`(`ID`) ON DELETE CASCADE ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `user_nominations_nomination` ADD CONSTRAINT `FK_2dc37a0c6b4f99e6e20c4903ae0` FOREIGN KEY (`nominationID`) REFERENCES `nomination`(`ID`) ON DELETE CASCADE ON UPDATE NO ACTION");
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey("user_nominations_nomination", "FK_2dc37a0c6b4f99e6e20c4903ae0");
        await queryRunner.dropForeignKey("user_nominations_nomination", "FK_c39e90811e78d3a759f9f75e37c");
        await queryRunner.dropIndex("user_nominations_nomination", "IDX_2dc37a0c6b4f99e6e20c4903ae");
        await queryRunner.dropIndex("user_nominations_nomination", "IDX_c39e90811e78d3a759f9f75e37");
        await queryRunner.dropTable("user_nominations_nomination");

        await queryRunner.query("ALTER TABLE `nomination` ADD `nominatorID` int NOT NULL");
        await queryRunner.query("ALTER TABLE `nomination` ADD CONSTRAINT `FK_29960f8747f6f51afcf0d5eaf76` FOREIGN KEY (`nominatorID`) REFERENCES `user`(`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

}
