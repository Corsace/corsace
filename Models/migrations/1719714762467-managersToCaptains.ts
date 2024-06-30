import { MigrationInterface, QueryRunner } from "typeorm";

export class ManagersToCaptains1719714762467 implements MigrationInterface {
    name = "ManagersToCaptains1719714762467";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`team\` DROP FOREIGN KEY \`FK_b567309778657df4f04db093279\``);
        await queryRunner.query(`ALTER TABLE \`team\` RENAME COLUMN \`managerID\` to \`captainID\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD \`captainMustPlay\` tinyint NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE \`team\` ADD CONSTRAINT \`FK_b98e8f4e249478552f756123b29\` FOREIGN KEY (\`captainID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);

        /*
            This is meant to update the trigger from `1690328808731-databaseTeamRegistrationTriggers.ts` which concerns itself with preventing a team from creating a team with the same name as another team in the last 10 minutes.
            This is to prevent server-side click spamming from creating multiple teams with the same name
        */
        await queryRunner.query(`DROP TRIGGER IF EXISTS avoid_duplicate_team`);
        await queryRunner.query(`
            CREATE TRIGGER avoid_duplicate_team
            BEFORE INSERT ON team
            FOR EACH ROW
            BEGIN
                DECLARE teamCount INT;
                SELECT COUNT(*) INTO teamCount
                FROM team
                WHERE team.name = NEW.name
                AND captainID = NEW.captainID
                AND team.createdAt > DATE_SUB(NOW(), INTERVAL 10 MINUTE);
                IF teamCount > 0 THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Team already created in the last 10 minutes';
                END IF;
            END
        `);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`team\` DROP FOREIGN KEY \`FK_b98e8f4e249478552f756123b29\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP COLUMN \`captainMustPlay\``);
        await queryRunner.query(`ALTER TABLE \`team\` RENAME COLUMN \`captainID\` to \`managerID\``);
        await queryRunner.query(`ALTER TABLE \`team\` ADD CONSTRAINT \`FK_b567309778657df4f04db093279\` FOREIGN KEY (\`managerID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);

        /*
            This is meant to update the trigger to revert back to `1690328808731-databaseTeamRegistrationTriggers.ts` which concerns itself with preventing a team from creating a team with the same name as another team in the last 10 minutes.
            This is to prevent server-side click spamming from creating multiple teams with the same name
        */
        await queryRunner.query(`DROP TRIGGER IF EXISTS avoid_duplicate_team`);
        await queryRunner.query(`
            CREATE TRIGGER avoid_duplicate_team
            BEFORE INSERT ON team
            FOR EACH ROW
            BEGIN
                DECLARE teamCount INT;
                SELECT COUNT(*) INTO teamCount
                FROM team
                WHERE team.name = NEW.name
                AND managerID = NEW.managerID
                AND team.createdAt > DATE_SUB(NOW(), INTERVAL 10 MINUTE);
                IF teamCount > 0 THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Team already created in the last 10 minutes';
                END IF;
            END
        `);
    }

}
