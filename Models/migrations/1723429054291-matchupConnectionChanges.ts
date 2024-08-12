import { MigrationInterface, QueryRunner } from "typeorm";

export class MatchupConnectionChanges1723429054291 implements MigrationInterface {
    name = "MatchupConnectionChanges1723429054291";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD \`loserNextMatchupID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD \`winnerNextMatchupID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD CONSTRAINT \`FK_04b07f127ba49bcc5a1804d951e\` FOREIGN KEY (\`loserNextMatchupID\`) REFERENCES \`matchup\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD CONSTRAINT \`FK_1153441e3dcc4503cb04115af00\` FOREIGN KEY (\`winnerNextMatchupID\`) REFERENCES \`matchup\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`
            CREATE TRIGGER check_matchup_connections
            BEFORE UPDATE ON matchup
            FOR EACH ROW
            BEGIN
                DECLARE NEWConnectionID INT;
                DECLARE connectionCount INT;
                
                IF OLD.winnerNextMatchupID != NEW.winnerNextMatchupID OR OLD.loserNextMatchupID != NEW.loserNextMatchupID THEN
                    IF OLD.winnerNextMatchupID != NEW.winnerNextMatchupID AND NEW.winnerNextMatchupID IS NOT NULL THEN
                        SET NEWConnectionID = NEW.winnerNextMatchupID;
                    ELSE
                        SET NEWConnectionID = NEW.loserNextMatchupID;
                    END IF;
                    
                    SELECT COUNT(*) INTO connectionCount
                    FROM matchup
                    WHERE loserNextMatchupID = NEWConnectionID
                    OR winnerNextMatchupID = NEWConnectionID;
                    
                    IF connectionCount >= 2 THEN
                        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Matchup cannot be connected to more than 2 matchups';
                    END IF;
                END IF;
            END
        `);
        
        await queryRunner.query(`UPDATE matchup JOIN \`matchup_previous_matchups_matchup\` pm ON pm.matchupID_2 = matchup.ID SET matchup.winnerNextMatchupID = pm.matchupID_1`);
        await queryRunner.query(`ALTER TABLE \`matchup_previous_matchups_matchup\` DROP FOREIGN KEY \`FK_5d4718758c212b06afb974f0d6d\``);
        await queryRunner.query(`ALTER TABLE \`matchup_previous_matchups_matchup\` DROP FOREIGN KEY \`FK_6627631cc3285362a1483684bfb\``);
        await queryRunner.query(`DROP INDEX \`IDX_5d4718758c212b06afb974f0d6\` ON \`matchup_previous_matchups_matchup\``);
        await queryRunner.query(`DROP INDEX \`IDX_6627631cc3285362a1483684bf\` ON \`matchup_previous_matchups_matchup\``);
        await queryRunner.query(`DROP TABLE IF EXISTS matchup_previous_matchups_matchup`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`matchup_previous_matchups_matchup\` (\`matchupID_1\` int NOT NULL, \`matchupID_2\` int NOT NULL, INDEX \`IDX_6627631cc3285362a1483684bf\` (\`matchupID_1\`), INDEX \`IDX_5d4718758c212b06afb974f0d6\` (\`matchupID_2\`), PRIMARY KEY (\`matchupID_1\`, \`matchupID_2\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`matchup_previous_matchups_matchup\` ADD CONSTRAINT \`FK_6627631cc3285362a1483684bfb\` FOREIGN KEY (\`matchupID_1\`) REFERENCES \`matchup\`(\`ID\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`matchup_previous_matchups_matchup\` ADD CONSTRAINT \`FK_5d4718758c212b06afb974f0d6d\` FOREIGN KEY (\`matchupID_2\`) REFERENCES \`matchup\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`INSERT INTO matchup_previous_matchups_matchup (matchupID_1, matchupID_2) SELECT winnerNextMatchupID, ID FROM matchup WHERE winnerNextMatchupID IS NOT NULL`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS check_matchup_connections`);
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP FOREIGN KEY \`FK_1153441e3dcc4503cb04115af00\``);
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP FOREIGN KEY \`FK_04b07f127ba49bcc5a1804d951e\``);
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP COLUMN \`winnerNextMatchupID\``);
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP COLUMN \`loserNextMatchupID\``);
    }

}
