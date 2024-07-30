import { MigrationInterface, QueryRunner } from "typeorm";

export class ReplayAndMD5Hashes1722301637126 implements MigrationInterface {
    name = "ReplayAndMD5Hashes1722301637126";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`custom_beatmap\` ADD \`md5\` char(32) NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` ADD \`replayMD5\` char(32) NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` ADD \`beatmapMD5\` char(32) NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` ADD \`maxCombo\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` ADD \`perfect\` tinyint NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` ADD \`count300\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` ADD \`count100\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` ADD \`count50\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` ADD \`countGeki\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` ADD \`countKatu\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` ADD \`misses\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`beatmap\` ADD \`md5\` char(32) NULL`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`beatmap\` DROP COLUMN \`md5\``);
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` DROP COLUMN \`misses\``);
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` DROP COLUMN \`countKatu\``);
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` DROP COLUMN \`countGeki\``);
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` DROP COLUMN \`count50\``);
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` DROP COLUMN \`count100\``);
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` DROP COLUMN \`count300\``);
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` DROP COLUMN \`perfect\``);
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` DROP COLUMN \`maxCombo\``);
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` DROP COLUMN \`beatmapMD5\``);
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` DROP COLUMN \`replayMD5\``);
        await queryRunner.query(`ALTER TABLE \`custom_beatmap\` DROP COLUMN \`md5\``);
    }

}
