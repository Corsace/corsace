import {MigrationInterface, QueryRunner} from "typeorm";

export class userCountry1631135989638 implements MigrationInterface {
    name = "userCountry1631135989638"

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user` ADD `country` tinytext NULL");
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user` DROP COLUMN `country`");
    }

}
