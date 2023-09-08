import { MigrationInterface, QueryRunner } from "typeorm";

export class MatchupSets1692800456243 implements MigrationInterface {
    name = "MatchupSets1692800456243";

    public async up (queryRunner: QueryRunner): Promise<void> {
        const rawMatchups = await queryRunner.query(`
            SELECT
                matchup.ID AS ID,
                matchup.team1Score AS team1Score,
                matchup.team2Score AS team2Score,
                matchup.firstID AS firstID,
                matchup.winnerID AS winnerID
            FROM matchup
        `);

        const rawMaps = await queryRunner.query(`
            SELECT
                matchup_map.ID AS ID,
                matchup_map.matchupID AS matchupID
            FROM matchup_map
        `);

        await queryRunner.query(`ALTER TABLE \`matchup\` DROP FOREIGN KEY \`FK_83d3c0a5db0f9245bc29ae6730f\``);
        await queryRunner.query(`ALTER TABLE \`matchup_map\` DROP FOREIGN KEY \`FK_a79753c16f88bb77b80f5d30b84\``);
        await queryRunner.query(`ALTER TABLE \`matchup_map\` CHANGE \`matchupID\` \`setID\` int NULL`);
        await queryRunner.query(`CREATE TABLE \`matchup_set\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`order\` int NOT NULL, \`team1Score\` int NOT NULL DEFAULT '0', \`team2Score\` int NOT NULL DEFAULT '0', \`matchupID\` int NULL, \`firstID\` int NULL, \`winnerID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP COLUMN \`firstID\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP COLUMN \`publicQualifiers\``);
        await queryRunner.query(`ALTER TABLE \`stage\` ADD \`publicScores\` tinyint NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE \`matchup_set\` ADD CONSTRAINT \`FK_d37310f22f6916ca71e660a43ea\` FOREIGN KEY (\`matchupID\`) REFERENCES \`matchup\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup_set\` ADD CONSTRAINT \`FK_7c83b77d57677f77d92985e09c8\` FOREIGN KEY (\`firstID\`) REFERENCES \`team\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup_set\` ADD CONSTRAINT \`FK_aea8f15057763d4769bc4573de0\` FOREIGN KEY (\`winnerID\`) REFERENCES \`team\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup_map\` ADD CONSTRAINT \`FK_040496538cb713b0233be919fd6\` FOREIGN KEY (\`setID\`) REFERENCES \`matchup_set\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);

        if (rawMatchups.length > 0) {
            await queryRunner.query(`
                INSERT INTO \`matchup_set\` (ID, team1Score, team2Score, matchupID, firstID, winnerID)
                VALUES ${rawMatchups.map((matchup: any, i: number) => `(${i + 1}, ${matchup.team1Score}, ${matchup.team2Score}, ${matchup.ID}, ${matchup.firstID || "NULL"}, ${matchup.winnerID || "NULL"})`).join(", ")}
            `);

            await Promise.all(rawMaps.map(map => queryRunner.query(`
                UPDATE \`matchup_map\`
                SET setID = (
                    SELECT matchup_set.ID
                    FROM matchup_set
                    WHERE matchup_set.matchupID = ${map.matchupID}
                    LIMIT 1
                )
                WHERE ID = ${map.ID}
            `)));
        }
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        const rawSets = await queryRunner.query(`
            SELECT
                matchup_set.ID AS ID,
                matchup_set.team1Score AS team1Score,
                matchup_set.team2Score AS team2Score,
                matchup_set.matchupID AS matchupID,
                matchup_set.firstID AS firstID,
                matchup_set.winnerID AS winnerID
            FROM matchup_set
        `);

        const rawMaps = await queryRunner.query(`
            SELECT
                matchup_map.ID AS ID,
                matchup.ID AS matchupID
            FROM matchup_map
            INNER JOIN matchup_set ON matchup_set.ID = matchup_map.setID
            INNER JOIN matchup ON matchup.ID = matchup_set.matchupID
        `);

        await queryRunner.query(`ALTER TABLE \`matchup_map\` DROP FOREIGN KEY \`FK_040496538cb713b0233be919fd6\``);
        await queryRunner.query(`ALTER TABLE \`matchup_set\` DROP FOREIGN KEY \`FK_aea8f15057763d4769bc4573de0\``);
        await queryRunner.query(`ALTER TABLE \`matchup_set\` DROP FOREIGN KEY \`FK_7c83b77d57677f77d92985e09c8\``);
        await queryRunner.query(`ALTER TABLE \`matchup_set\` DROP FOREIGN KEY \`FK_d37310f22f6916ca71e660a43ea\``);
        await queryRunner.query(`ALTER TABLE \`stage\` DROP COLUMN \`publicScores\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD \`publicQualifiers\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD \`firstID\` int NULL`);
        await queryRunner.query(`DROP TABLE \`matchup_set\``);
        await queryRunner.query(`ALTER TABLE \`matchup_map\` CHANGE \`setID\` \`matchupID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`matchup_map\` ADD CONSTRAINT \`FK_a79753c16f88bb77b80f5d30b84\` FOREIGN KEY (\`matchupID\`) REFERENCES \`matchup\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup\` ADD CONSTRAINT \`FK_83d3c0a5db0f9245bc29ae6730f\` FOREIGN KEY (\`firstID\`) REFERENCES \`team\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);

        await Promise.all(rawSets.map((set: any) => queryRunner.query(`
            UPDATE \`matchup\`
            SET matchup.team1Score = ${set.team1Score}, matchup.team2Score = ${set.team2Score}, matchup.firstID = ${set.firstID || "NULL"}, matchup.winnerID = ${set.winnerID || "NULL"}
            WHERE matchup.ID = ${set.matchupID}
        `)));

        await Promise.all(rawMaps.map((map: any) => queryRunner.query(`
            UPDATE \`matchup_map\`
            SET matchupID = ${map.matchupID}
            WHERE ID = ${map.ID}
        `)));
    }

}
