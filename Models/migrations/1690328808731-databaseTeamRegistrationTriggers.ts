import { MigrationInterface, QueryRunner } from "typeorm";

export class DatabaseTeamRegistrationTriggers1690328808731 implements MigrationInterface {
    name = "DatabaseTeamRegistrationTriggers1690328808731";

    public async up (queryRunner: QueryRunner): Promise<void> {
        /*
            This trigger prevents a team from joining another matchup in a qualifier stage if they already have a matchup in a qualifier stage.
            This is to prevent a team from joining multiple qualifier matchups in the same qualifier stage.
        */
        await queryRunner.query(`
            CREATE TRIGGER validate_qualifier_matchup
            BEFORE INSERT ON matchup_teams_team
            FOR EACH ROW
            BEGIN
                DECLARE matchupCount INT;
                SELECT COUNT(*) INTO matchupCount
                FROM stage
                INNER JOIN matchup ON matchup.stageID = stage.ID
                INNER JOIN matchup_teams_team ON matchup_teams_team.matchupID = matchup.ID
                WHERE matchup_teams_team.teamID = NEW.teamID
                AND stage.stageType = '0';
                IF matchupCount > 0 THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Team already has a qualifier matchup';
                END IF;
            END
        `);
        /*
            This trigger prevents a team from creating a team with the same name as another team in the last 10 minutes.
            This is to prevent server-side click spamming from creating multiple teams with the same name
        */
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

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER avoid_duplicate_team`);
        await queryRunner.query(`DROP TRIGGER validate_qualifier_matchup`);
    }

}
