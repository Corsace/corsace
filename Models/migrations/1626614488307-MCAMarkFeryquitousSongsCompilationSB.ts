import {MigrationInterface, QueryRunner} from "typeorm";

export class MCAMarkFeryquitousSongsCompilationSB1626614488307 implements MigrationInterface {

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("UPDATE `beatmap` SET `storyboard` = 1 WHERE `beatmapsetID` = 1124097;");
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("UPDATE `beatmap` SET `storyboard` = 0 WHERE `beatmapsetID` = 1124097;");
    }

}
