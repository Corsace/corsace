import {MigrationInterface, QueryRunner} from "typeorm";

export class AddIndexes1623742559383 implements MigrationInterface {
    name = "AddIndexes1623742559383"

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE INDEX `IDX_ed15bbe252c98c2434c957135c` ON `mca_eligibility` (`year`)");
        await queryRunner.query("CREATE INDEX `IDX_d8cba596037ac6b2609ccb0144` ON `mca_eligibility` (`year`, `standard`, `taiko`, `fruits`, `mania`, `storyboard`)");
        await queryRunner.query("CREATE INDEX `IDX_7a5b3c277aa5128bffa27de7f9` ON `user` (`discordUsername`)");
        await queryRunner.query("CREATE INDEX `IDX_79bbe1a6932e41f230596a3875` ON `user` (`osuUsername`)");
        await queryRunner.query("CREATE INDEX `IDX_f67b952d242ccef789618430b4` ON `beatmap` (`totalSR`)");
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_f67b952d242ccef789618430b4` ON `beatmap`");
        await queryRunner.query("DROP INDEX `IDX_79bbe1a6932e41f230596a3875` ON `user`");
        await queryRunner.query("DROP INDEX `IDX_7a5b3c277aa5128bffa27de7f9` ON `user`");
        await queryRunner.query("DROP INDEX `IDX_d8cba596037ac6b2609ccb0144` ON `mca_eligibility`");
        await queryRunner.query("DROP INDEX `IDX_ed15bbe252c98c2434c957135c` ON `mca_eligibility`");
    }

}
