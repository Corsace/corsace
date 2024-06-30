import { MigrationInterface, QueryRunner } from "typeorm";

export class ManagersToCaptains1719714762467 implements MigrationInterface {
    name = "ManagersToCaptains1719714762467";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`team\` DROP FOREIGN KEY \`FK_b567309778657df4f04db093279\``);
        await queryRunner.query(`ALTER TABLE \`team\` RENAME COLUMN \`managerID\` to \`captainID\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD \`captainMustPlay\` tinyint NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE \`team\` ADD CONSTRAINT \`FK_b98e8f4e249478552f756123b29\` FOREIGN KEY (\`captainID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`team\` DROP FOREIGN KEY \`FK_b98e8f4e249478552f756123b29\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP COLUMN \`captainMustPlay\``);
        await queryRunner.query(`ALTER TABLE \`team\` RENAME COLUMN \`captainID\` to \`managerID\``);
        await queryRunner.query(`ALTER TABLE \`team\` ADD CONSTRAINT \`FK_b567309778657df4f04db093279\` FOREIGN KEY (\`managerID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
