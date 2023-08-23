import { MigrationInterface, QueryRunner } from "typeorm";
import { Matchup } from "../tournaments/matchup";
import { MatchupSet } from "../tournaments/matchupSet";

export class MatchupSets1692800456243 implements MigrationInterface {
    name = "MatchupSets1692800456243";

    public async up (queryRunner: QueryRunner): Promise<void> {
        const matchups = await Matchup
            .createQueryBuilder("matchup")
            .leftJoinAndSelect("matchup.maps", "map")
            .leftJoinAndSelect("matchup.first", "first")
            .leftJoinAndSelect("matchup.winner", "winner")
            .getMany();

        await queryRunner.query(`ALTER TABLE \`matchup\` DROP FOREIGN KEY \`FK_83d3c0a5db0f9245bc29ae6730f\``);
        await queryRunner.query(`ALTER TABLE \`matchup_map\` DROP FOREIGN KEY \`FK_a79753c16f88bb77b80f5d30b84\``);
        await queryRunner.query(`ALTER TABLE \`matchup_map\` CHANGE \`matchupID\` \`setID\` int NULL`);
        await queryRunner.query(`CREATE TABLE \`matchup_set\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`team1Score\` int NOT NULL DEFAULT '0', \`team2Score\` int NOT NULL DEFAULT '0', \`matchupID\` int NULL, \`firstID\` int NULL, \`winnerID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`matchup\` DROP COLUMN \`firstID\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP COLUMN \`publicQualifiers\``);
        await queryRunner.query(`ALTER TABLE \`stage\` ADD \`publicScores\` tinyint NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE \`matchup_set\` ADD CONSTRAINT \`FK_d37310f22f6916ca71e660a43ea\` FOREIGN KEY (\`matchupID\`) REFERENCES \`matchup\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup_set\` ADD CONSTRAINT \`FK_7c83b77d57677f77d92985e09c8\` FOREIGN KEY (\`firstID\`) REFERENCES \`team\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup_set\` ADD CONSTRAINT \`FK_aea8f15057763d4769bc4573de0\` FOREIGN KEY (\`winnerID\`) REFERENCES \`team\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup_map\` ADD CONSTRAINT \`FK_040496538cb713b0233be919fd6\` FOREIGN KEY (\`setID\`) REFERENCES \`matchup_set\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);

        await Promise.all(matchups.map(matchup => {
            const set = new MatchupSet();
            set.matchup = matchup;
            set.order = 1;
            set.team1Score = matchup.team1Score;
            set.team2Score = matchup.team2Score;
            set.first = matchup.first;
            set.winner = matchup.winner;
            set.maps = matchup.maps;
            return set.save();
        }));
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        const matchups = await Matchup
            .createQueryBuilder("matchup")
            .leftJoinAndSelect("matchup.sets", "set")
            .leftJoinAndSelect("set.maps", "map")
            .leftJoinAndSelect("set.first", "first")
            .leftJoinAndSelect("set.winner", "winner")
            .getMany();

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

        for (const matchup of matchups) {
            matchup.team1Score = matchup.sets?.[0].team1Score ?? 0;
            matchup.team2Score = matchup.sets?.[0].team2Score ?? 0;
            matchup.first = matchup.sets?.[0].first;
            matchup.winner = matchup.sets?.[0].winner;
            matchup.maps = matchup.sets?.[0].maps;
            await matchup.save();
        }
    }

}
