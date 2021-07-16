import {MigrationInterface, QueryRunner} from "typeorm";

export class MCARemoveCategoryVettingField1626142105858 implements MigrationInterface {
    name = "MCARemoveCategoryVettingField1626142105858"

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `category` DROP COLUMN `requiresVetting`");
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `category` ADD `requiresVetting` tinyint NOT NULL DEFAULT 0");
    }

}
