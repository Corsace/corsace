import { MigrationInterface, QueryRunner } from "typeorm";

export class MoreTournamentRoles1690653130873 implements MigrationInterface {
    name = "MoreTournamentRoles1690653130873";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tournament_role\` CHANGE \`roleType\` \`roleType\` enum ('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11') NOT NULL`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tournament_role\` CHANGE \`roleType\` \`roleType\` enum ('0', '1', '2', '3', '4', '5', '6', '7', '8', '9') NOT NULL`);
    }

}
