import { MigrationInterface, QueryRunner } from "typeorm";

export class jobBoard1683581603217 implements MigrationInterface {
    name = "jobBoard1683581603217";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`job_post\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`description\` varchar(255) NOT NULL, \`jobBoardThread\` varchar(255) NULL, \`deadline\` datetime NULL, \`createdByID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` ADD \`jobPostID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` ADD UNIQUE INDEX \`IDX_2627a9eac7586470ddf3a13823\` (\`jobPostID\`)`);
        await queryRunner.query(`ALTER TABLE \`tournament_channel\` CHANGE \`channelType\` \`channelType\` enum ('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12') NOT NULL DEFAULT '0'`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_2627a9eac7586470ddf3a13823\` ON \`mappool_map\` (\`jobPostID\`)`);
        await queryRunner.query(`ALTER TABLE \`job_post\` ADD CONSTRAINT \`FK_ce8bbfda770c0e4f4efbdf12b46\` FOREIGN KEY (\`createdByID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` ADD CONSTRAINT \`FK_2627a9eac7586470ddf3a138231\` FOREIGN KEY (\`jobPostID\`) REFERENCES \`job_post\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`mappool_map\` DROP FOREIGN KEY \`FK_2627a9eac7586470ddf3a138231\``);
        await queryRunner.query(`ALTER TABLE \`job_post\` DROP FOREIGN KEY \`FK_ce8bbfda770c0e4f4efbdf12b46\``);
        await queryRunner.query(`DROP INDEX \`REL_2627a9eac7586470ddf3a13823\` ON \`mappool_map\``);
        await queryRunner.query(`ALTER TABLE \`tournament_channel\` CHANGE \`channelType\` \`channelType\` enum ('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11') NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` DROP INDEX \`IDX_2627a9eac7586470ddf3a13823\``);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` DROP COLUMN \`jobPostID\``);
        await queryRunner.query(`DROP TABLE \`job_post\``);
    }

}
