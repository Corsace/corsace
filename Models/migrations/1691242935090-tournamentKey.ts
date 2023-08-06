import { MigrationInterface, QueryRunner } from "typeorm";

export class TournamentKey1691242935090 implements MigrationInterface {
    name = "TournamentKey1691242935090";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD \`key\` varchar(128) NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD UNIQUE INDEX \`IDX_f7f16b44adbc8bd6510ce558cf\` (\`key\`)`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP INDEX \`IDX_f7f16b44adbc8bd6510ce558cf\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP COLUMN \`key\``);
    }

}
