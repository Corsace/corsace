import { MigrationInterface, QueryRunner } from "typeorm";

export class MapppoolReplays1691896567711 implements MigrationInterface {
    name = "MapppoolReplays1691896567711";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`mappool_replay\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`link\` varchar(255) NOT NULL, \`score\` int NOT NULL, \`createdByID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` ADD \`replayID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` ADD UNIQUE INDEX \`IDX_0b5e8f4ec5a4bf0497c8762129\` (\`replayID\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_0b5e8f4ec5a4bf0497c8762129\` ON \`mappool_map\` (\`replayID\`)`);
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` ADD CONSTRAINT \`FK_ecff4f807aff2921fbc1db4cf8b\` FOREIGN KEY (\`createdByID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` ADD CONSTRAINT \`FK_0b5e8f4ec5a4bf0497c87621293\` FOREIGN KEY (\`replayID\`) REFERENCES \`mappool_replay\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`mappool_map\` DROP FOREIGN KEY \`FK_0b5e8f4ec5a4bf0497c87621293\``);
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` DROP FOREIGN KEY \`FK_ecff4f807aff2921fbc1db4cf8b\``);
        await queryRunner.query(`DROP INDEX \`REL_0b5e8f4ec5a4bf0497c8762129\` ON \`mappool_map\``);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` DROP INDEX \`IDX_0b5e8f4ec5a4bf0497c8762129\``);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` DROP COLUMN \`replayID\``);
        await queryRunner.query(`DROP TABLE \`mappool_replay\``);
    }

}
