import {MigrationInterface, QueryRunner} from "typeorm";

export class MCAMarkAunNoBeatsSB1626617267630 implements MigrationInterface {

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("UPDATE `beatmap` SET `storyboard` = 1 WHERE `beatmapsetID` = 1153984;");
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("UPDATE `beatmap` SET `storyboard` = 0 WHERE `beatmapsetID` = 1153984;");
    }

}
