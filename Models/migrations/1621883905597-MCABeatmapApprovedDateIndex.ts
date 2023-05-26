import {MigrationInterface, QueryRunner} from "typeorm";

export class MCABeatmapApprovedDateIndex1621883905597 implements MigrationInterface {
    name = "MCABeatmapApprovedDateIndex1621883905597";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE INDEX `IDX_bbf5c07b665fc67a291f7cd3fa` ON `beatmapset` (`approvedDate`)");
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_bbf5c07b665fc67a291f7cd3fa` ON `beatmapset`");
    }

}
