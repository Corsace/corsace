import {MigrationInterface, QueryRunner} from "typeorm";

export class MCACategoryDescriptionDeletion1620809087589 implements MigrationInterface {
    name = "MCACategoryDescriptionDeletion1620809087589"

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `category` DROP COLUMN `description`");
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `category` ADD `description` varchar(255) NOT NULL");
    }

}
