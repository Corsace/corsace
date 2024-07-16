import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateValidateQualifierMatchup1721168567643 implements MigrationInterface {
    name = "UpdateValidateQualifierMatchup1721168567643";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER IF EXISTS validate_qualifier_matchup`);
        await queryRunner.query(`
            CREATE TRIGGER validate_qualifier_matchup
            BEFORE INSERT ON matchup_teams_team
            FOR EACH ROW
            BEGIN
                DECLARE matchupCount INT;
                DECLARE stageID INT;

                SELECT stageID INTO stageID
                FROM matchup
                WHERE matchup.ID = NEW.matchupID;

                SELECT COUNT(*) INTO matchupCount
                FROM stage
                INNER JOIN matchup ON matchup.stageID = stage.ID
                INNER JOIN matchup_teams_team ON matchup_teams_team.matchupID = matchup.ID
                WHERE matchup_teams_team.teamID = NEW.teamID
                AND stage.stageType = '0'
                AND stage.ID = stageID;

                IF matchupCount > 0 THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Team already has a qualifier matchup';
                END IF;
            END
        `);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER IF EXISTS validate_qualifier_matchup`);
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
    }

}
