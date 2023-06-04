import { MigrationInterface, QueryRunner } from "typeorm";

export class generalStaffRoleChannel1685825910427 implements MigrationInterface {
    name = "generalStaffRoleChannel1685825910427";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tournament_role\` CHANGE \`roleType\` \`roleType\` enum ('0', '1', '2', '3', '4', '5', '6', '7', '8', '9') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament_channel\` CHANGE \`channelType\` \`channelType\` enum ('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14') NOT NULL DEFAULT '0'`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tournament_channel\` CHANGE \`channelType\` \`channelType\` enum CHARACTER SET "utf8mb4" COLLATE "utf8mb4_general_ci" ('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12') NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`tournament_role\` CHANGE \`roleType\` \`roleType\` enum CHARACTER SET "utf8mb4" COLLATE "utf8mb4_general_ci" ('0', '1', '2', '3', '4', '5', '6', '7', '8') NOT NULL`);
    }

}
