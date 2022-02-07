import {MigrationInterface, QueryRunner} from "typeorm";

export class MCANominateVoteBeatmaps1643610856614 implements MigrationInterface {
    name = "MCANominateVoteBeatmaps1643610856614"

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`vote\` ADD \`beatmapID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`nomination\` ADD \`beatmapID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`vote\` ADD CONSTRAINT \`FK_846b50e721f0ee93d6e33dc6060\` FOREIGN KEY (\`beatmapID\`) REFERENCES \`beatmap\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`nomination\` ADD CONSTRAINT \`FK_6c8a7d8f5c29f10184542525208\` FOREIGN KEY (\`beatmapID\`) REFERENCES \`beatmap\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`category\` ADD \`filterToponly\` tinyint NOT NULL DEFAULT 0`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`category\` DROP COLUMN \`filterToponly\``);
        await queryRunner.query(`ALTER TABLE \`nomination\` DROP FOREIGN KEY \`FK_6c8a7d8f5c29f10184542525208\``);
        await queryRunner.query(`ALTER TABLE \`vote\` DROP FOREIGN KEY \`FK_846b50e721f0ee93d6e33dc6060\``);
        await queryRunner.query(`ALTER TABLE \`nomination\` DROP COLUMN \`beatmapID\``);
        await queryRunner.query(`ALTER TABLE \`vote\` DROP COLUMN \`beatmapID\``);
    }

}
