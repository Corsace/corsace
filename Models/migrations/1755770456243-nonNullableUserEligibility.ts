import { MigrationInterface, QueryRunner } from "typeorm";

export class NonNullableUserEligibility1755770456243 implements MigrationInterface {
    name = "NonNullableUserEligibility1755770456243";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM \`mca_eligibility\` WHERE \`userID\` IS NULL`); // Remove any null entries, not reversible
        await queryRunner.query(`ALTER TABLE \`mca_eligibility\` MODIFY \`userID\` int NOT NULL`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`mca_eligibility\` MODIFY \`userID\` int NULL`);
    }
}
