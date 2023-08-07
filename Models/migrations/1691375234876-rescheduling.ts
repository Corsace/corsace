import { MigrationInterface, QueryRunner } from "typeorm";

export class Rescheduling1691375234876 implements MigrationInterface {
    name = "Rescheduling1691375234876";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tournament_channel\` CHANGE \`channelType\` \`channelType\` enum ('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15') NOT NULL DEFAULT '0'`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tournament_channel\` CHANGE \`channelType\` \`channelType\` enum ('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14') NOT NULL DEFAULT '0'`);
    }

}
