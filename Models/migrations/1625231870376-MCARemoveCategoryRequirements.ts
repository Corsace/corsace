import {MigrationInterface, QueryRunner} from "typeorm";

export class MCARemoveCategoryRequirements1625231870376 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `category` DROP COLUMN `isRequired`");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `category` ADD `isRequired` tinyint NOT NULL DEFAULT 0");
    }

}
