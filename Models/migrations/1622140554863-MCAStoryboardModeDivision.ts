import {MigrationInterface, QueryRunner} from "typeorm";

export class MCAStoryboardModeDivision1622140554863 implements MigrationInterface {
    name = "MCAStoryboardModeDivision1622140554863"

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("INSERT INTO `mode_division` VALUES (5, 'storyboard')");

    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DELETE FROM `mode_division` WHERE ID = 5");
    }

}
