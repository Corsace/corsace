import { MigrationInterface, QueryRunner } from "typeorm";

export class NonNullRelationEnforcement1711095646728 implements MigrationInterface {
    name = "NonNullRelationEnforcement1711095646728";

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_nominations_nomination\` DROP FOREIGN KEY \`FK_2dc37a0c6b4f99e6e20c4903ae0\``);
        await queryRunner.query(`ALTER TABLE \`user_nominations_nomination\` DROP FOREIGN KEY \`FK_c39e90811e78d3a759f9f75e37c\``);

        await queryRunner.query(`DROP INDEX \`IDX_2627a9eac7586470ddf3a13823\` ON \`mappool_map\``);
        await queryRunner.query(`DROP INDEX \`IDX_0b5e8f4ec5a4bf0497c8762129\` ON \`mappool_map\``);

        await queryRunner.query(`ALTER TABLE \`demerit_report\` DROP FOREIGN KEY \`FK_8cc900fb5b596f03c0a390b6bd5\``);
        await queryRunner.query(`DELETE FROM \`demerit_report\` WHERE \`userID\` IS NULL`);
        await queryRunner.query(`ALTER TABLE \`demerit_report\` CHANGE \`userID\` \`userID\` int NOT NULL`);

        await queryRunner.query(`ALTER TABLE \`mca_eligibility\` DROP FOREIGN KEY \`FK_f338d32f7d34062acaeb1de0b80\``);
        await queryRunner.query(`DELETE FROM \`mca_eligibility\` WHERE \`userID\` IS NULL`);
        await queryRunner.query(`ALTER TABLE \`mca_eligibility\` CHANGE \`userID\` \`userID\` int NOT NULL`);

        await queryRunner.query(`ALTER TABLE \`beatmapset\` DROP FOREIGN KEY \`FK_03d8487dc1b222d8b1bbb02967f\``);
        await queryRunner.query(`DELETE FROM \`beatmapset\` WHERE \`creatorID\` IS NULL`);
        await queryRunner.query(`ALTER TABLE \`beatmapset\` CHANGE \`creatorID\` \`creatorID\` int NOT NULL`);

        await queryRunner.query(`ALTER TABLE \`mappool_map_history\` DROP FOREIGN KEY \`FK_f2a5ef6ded9551679af2de6e05b\``);
        await queryRunner.query(`ALTER TABLE \`mappool_map_history\` DROP FOREIGN KEY \`FK_4d71cb55c73a73e235eaa941a02\``);
        await queryRunner.query(`DELETE FROM \`mappool_map_history\` WHERE \`createdByID\` IS NULL OR \`mappoolMapID\` IS NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_history\` CHANGE \`createdByID\` \`createdByID\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_history\` CHANGE \`mappoolMapID\` \`mappoolMapID\` int NOT NULL`);

        await queryRunner.query(`ALTER TABLE \`mappool_map_skill\` DROP FOREIGN KEY \`FK_0822af5af607323fcae9a3a8b01\``);
        await queryRunner.query(`ALTER TABLE \`mappool_map_skill\` DROP FOREIGN KEY \`FK_40c169a892e09dd925312b5d3ed\``);
        await queryRunner.query(`DELETE FROM \`mappool_map_skill\` WHERE \`userID\` IS NULL OR \`mappoolMapID\` IS NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_skill\` CHANGE \`userID\` \`userID\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_skill\` CHANGE \`mappoolMapID\` \`mappoolMapID\` int NOT NULL`);

        await queryRunner.query(`ALTER TABLE \`mappool_map_weight\` DROP FOREIGN KEY \`FK_451d2d1f81dc355dcf49f3839f5\``);
        await queryRunner.query(`ALTER TABLE \`mappool_map_weight\` DROP FOREIGN KEY \`FK_0e04c219d2aaed067c03f3eb405\``);
        await queryRunner.query(`DELETE FROM \`mappool_map_weight\` WHERE \`userID\` IS NULL OR \`mappoolMapID\` IS NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_weight\` CHANGE \`userID\` \`userID\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_weight\` CHANGE \`mappoolMapID\` \`mappoolMapID\` int NOT NULL`);

        await queryRunner.query(`ALTER TABLE \`tournament_channel\` DROP FOREIGN KEY \`FK_9477807d96ff1c5e0489299f422\``);
        await queryRunner.query(`ALTER TABLE \`tournament_channel\` DROP FOREIGN KEY \`FK_ea3314cdbf262c321984d9c16a0\``);
        await queryRunner.query(`DELETE FROM \`tournament_channel\` WHERE \`createdByID\` IS NULL OR \`tournamentID\` IS NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament_channel\` CHANGE \`createdByID\` \`createdByID\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament_channel\` CHANGE \`tournamentID\` \`tournamentID\` int NOT NULL`);

        await queryRunner.query(`ALTER TABLE \`tournament_role\` DROP FOREIGN KEY \`FK_3d7980b021649df8957d852d602\``);
        await queryRunner.query(`ALTER TABLE \`tournament_role\` DROP FOREIGN KEY \`FK_6e42fb6285926f58915731a9476\``);
        await queryRunner.query(`DELETE FROM \`tournament_role\` WHERE \`createdByID\` IS NULL OR \`tournamentID\` IS NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament_role\` CHANGE \`createdByID\` \`createdByID\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament_role\` CHANGE \`tournamentID\` \`tournamentID\` int NOT NULL`);

        await queryRunner.query(`ALTER TABLE \`team_invite\` DROP FOREIGN KEY \`FK_14775f5b9172d5acf3e5467b74c\``);
        await queryRunner.query(`ALTER TABLE \`team_invite\` DROP FOREIGN KEY \`FK_ea34840060c37877446513060b1\``);
        await queryRunner.query(`DELETE FROM \`team_invite\` WHERE \`userID\` IS NULL OR \`teamID\` IS NULL`);
        await queryRunner.query(`ALTER TABLE \`team_invite\` CHANGE \`userID\` \`userID\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`team_invite\` CHANGE \`teamID\` \`teamID\` int NOT NULL`);

        await queryRunner.query(`ALTER TABLE \`matchup_message\` DROP FOREIGN KEY \`FK_4ad72ce234f1cbaa9e7b924f072\``);
        await queryRunner.query(`ALTER TABLE \`matchup_message\` DROP FOREIGN KEY \`FK_f89aefadbe20491b32a761226d1\``);
        await queryRunner.query(`DELETE FROM \`matchup_message\` WHERE \`userID\` IS NULL OR \`matchupID\` IS NULL`);
        await queryRunner.query(`ALTER TABLE \`matchup_message\` CHANGE \`userID\` \`userID\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`matchup_message\` CHANGE \`matchupID\` \`matchupID\` int NOT NULL`);

        await queryRunner.query(`ALTER TABLE \`matchup_score\` DROP FOREIGN KEY \`FK_4bb1fb8db221ad4fbc0051008e5\``);
        await queryRunner.query(`ALTER TABLE \`matchup_score\` DROP FOREIGN KEY \`FK_4e1cbe446109f6c61576219f5f7\``);
        await queryRunner.query(`DELETE FROM \`matchup_score\` WHERE \`userID\` IS NULL OR \`mapID\` IS NULL`);
        await queryRunner.query(`ALTER TABLE \`matchup_score\` CHANGE \`userID\` \`userID\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`matchup_score\` CHANGE \`mapID\` \`mapID\` int NOT NULL`);

        await queryRunner.query(`ALTER TABLE \`matchup_map\` DROP FOREIGN KEY \`FK_66239baa2ee06ed2f7a00e6b724\``);
        await queryRunner.query(`ALTER TABLE \`matchup_map\` DROP FOREIGN KEY \`FK_040496538cb713b0233be919fd6\``);
        await queryRunner.query(`DELETE FROM \`matchup_map\` WHERE \`mapID\` IS NULL OR \`setID\` IS NULL`);
        await queryRunner.query(`ALTER TABLE \`matchup_map\` CHANGE \`mapID\` \`mapID\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`matchup_map\` CHANGE \`setID\` \`setID\` int NOT NULL`);

        await queryRunner.query(`ALTER TABLE \`team\` DROP FOREIGN KEY \`FK_b567309778657df4f04db093279\``);
        await queryRunner.query(`DELETE FROM \`team\` WHERE \`managerID\` IS NULL`);
        await queryRunner.query(`ALTER TABLE \`team\` CHANGE \`managerID\` \`managerID\` int NOT NULL`);

        await queryRunner.query(`ALTER TABLE \`tournament\` DROP FOREIGN KEY \`FK_d837b180632c18af2322e473866\``);
        await queryRunner.query(`DELETE FROM \`tournament\` WHERE \`organizerID\` IS NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament\` CHANGE \`organizerID\` \`organizerID\` int NOT NULL`);

        await queryRunner.query(`ALTER TABLE \`stage\` DROP FOREIGN KEY \`FK_c31ffe63e6de6c2718ae92a7422\``);
        await queryRunner.query(`ALTER TABLE \`stage\` DROP FOREIGN KEY \`FK_40a84786ce719424b15ab38e9c7\``);
        await queryRunner.query(`DELETE FROM \`stage\` WHERE \`createdByID\` IS NULL OR \`tournamentID\` IS NULL`);
        await queryRunner.query(`ALTER TABLE \`stage\` CHANGE \`createdByID\` \`createdByID\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`stage\` CHANGE \`tournamentID\` \`tournamentID\` int NOT NULL`);

        await queryRunner.query(`ALTER TABLE \`round\` DROP FOREIGN KEY \`FK_d1a278fd1c02d08ffb984189af0\``);
        await queryRunner.query(`DELETE FROM \`round\` WHERE \`stageID\` IS NULL`);
        await queryRunner.query(`ALTER TABLE \`round\` CHANGE \`stageID\` \`stageID\` int NOT NULL`);

        await queryRunner.query(`ALTER TABLE \`mappool\` DROP FOREIGN KEY \`FK_12804c33b7cb1323ee54a9ae10e\``);
        await queryRunner.query(`ALTER TABLE \`mappool\` DROP FOREIGN KEY \`FK_1542f1d5547fb8e2142309fbcf8\``);
        await queryRunner.query(`DELETE FROM \`mappool\` WHERE \`createdByID\` IS NULL OR \`stageID\` IS NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool\` CHANGE \`createdByID\` \`createdByID\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool\` CHANGE \`stageID\` \`stageID\` int NOT NULL`);

        await queryRunner.query(`ALTER TABLE \`mappool_slot\` DROP FOREIGN KEY \`FK_9bb2035c81dbe73e1f715b34641\``);
        await queryRunner.query(`ALTER TABLE \`mappool_slot\` DROP FOREIGN KEY \`FK_db1501100e2089e602531eb050b\``);
        await queryRunner.query(`DELETE FROM \`mappool_slot\` WHERE \`createdByID\` IS NULL OR \`mappoolID\` IS NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_slot\` CHANGE \`createdByID\` \`createdByID\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_slot\` CHANGE \`mappoolID\` \`mappoolID\` int NOT NULL`);

        await queryRunner.query(`ALTER TABLE \`job_post\` DROP FOREIGN KEY \`FK_ce8bbfda770c0e4f4efbdf12b46\``);
        await queryRunner.query(`DELETE FROM \`job_post\` WHERE \`createdByID\` IS NULL`);
        await queryRunner.query(`ALTER TABLE \`job_post\` CHANGE \`createdByID\` \`createdByID\` int NOT NULL`);

        await queryRunner.query(`ALTER TABLE \`mappool_replay\` DROP FOREIGN KEY \`FK_ecff4f807aff2921fbc1db4cf8b\``);
        await queryRunner.query(`DELETE FROM \`mappool_replay\` WHERE \`createdByID\` IS NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` CHANGE \`createdByID\` \`createdByID\` int NOT NULL`);

        await queryRunner.query(`ALTER TABLE \`mappool_map\` DROP FOREIGN KEY \`FK_f7a0bafbeca589f8a546bcc525c\``);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` DROP FOREIGN KEY \`FK_e0fd6bfacfd88cbd77e4983689d\``);
        await queryRunner.query(`DELETE FROM \`mappool_map\` WHERE \`createdByID\` IS NULL OR \`slotID\` IS NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` CHANGE \`createdByID\` \`createdByID\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` CHANGE \`slotID\` \`slotID\` int NOT NULL`);

        await queryRunner.query(`ALTER TABLE \`username_change\` DROP FOREIGN KEY \`FK_375c55a3e9a6271ebda2623e2ca\``);
        await queryRunner.query(`DELETE FROM \`username_change\` WHERE \`userID\` IS NULL`);
        await queryRunner.query(`ALTER TABLE \`username_change\` CHANGE \`userID\` \`userID\` int NOT NULL`);

        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`osuUserid\` \`osuUserid\` varchar(255) NOT NULL`);

        await queryRunner.query(`ALTER TABLE \`user_comment\` CHANGE \`updatedAt\` \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);

        await queryRunner.query(`ALTER TABLE \`user_statistics\` DROP FOREIGN KEY \`FK_09b61b49529146fc1572abbc550\``);
        await queryRunner.query(`ALTER TABLE \`user_statistics\` DROP FOREIGN KEY \`FK_fe8512e6f7cfc1589a44a72a82f\``);
        await queryRunner.query(`DELETE FROM \`user_statistics\` WHERE \`userID\` IS NULL OR \`modeDivisionID\` IS NULL`);
        await queryRunner.query(`ALTER TABLE \`user_statistics\` CHANGE \`modeDivisionID\` \`modeDivisionID\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`user_statistics\` CHANGE \`userID\` \`userID\` int NOT NULL`);

        await queryRunner.query(`ALTER TABLE \`demerit_report\` ADD CONSTRAINT \`FK_8cc900fb5b596f03c0a390b6bd5\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mca_eligibility\` ADD CONSTRAINT \`FK_f338d32f7d34062acaeb1de0b80\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`beatmapset\` ADD CONSTRAINT \`FK_03d8487dc1b222d8b1bbb02967f\` FOREIGN KEY (\`creatorID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_history\` ADD CONSTRAINT \`FK_f2a5ef6ded9551679af2de6e05b\` FOREIGN KEY (\`createdByID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_history\` ADD CONSTRAINT \`FK_4d71cb55c73a73e235eaa941a02\` FOREIGN KEY (\`mappoolMapID\`) REFERENCES \`mappool_map\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_skill\` ADD CONSTRAINT \`FK_0822af5af607323fcae9a3a8b01\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_skill\` ADD CONSTRAINT \`FK_40c169a892e09dd925312b5d3ed\` FOREIGN KEY (\`mappoolMapID\`) REFERENCES \`mappool_map\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_weight\` ADD CONSTRAINT \`FK_451d2d1f81dc355dcf49f3839f5\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_weight\` ADD CONSTRAINT \`FK_0e04c219d2aaed067c03f3eb405\` FOREIGN KEY (\`mappoolMapID\`) REFERENCES \`mappool_map\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tournament_channel\` ADD CONSTRAINT \`FK_9477807d96ff1c5e0489299f422\` FOREIGN KEY (\`createdByID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tournament_channel\` ADD CONSTRAINT \`FK_ea3314cdbf262c321984d9c16a0\` FOREIGN KEY (\`tournamentID\`) REFERENCES \`tournament\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tournament_role\` ADD CONSTRAINT \`FK_3d7980b021649df8957d852d602\` FOREIGN KEY (\`createdByID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tournament_role\` ADD CONSTRAINT \`FK_6e42fb6285926f58915731a9476\` FOREIGN KEY (\`tournamentID\`) REFERENCES \`tournament\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`team_invite\` ADD CONSTRAINT \`FK_14775f5b9172d5acf3e5467b74c\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`team_invite\` ADD CONSTRAINT \`FK_ea34840060c37877446513060b1\` FOREIGN KEY (\`teamID\`) REFERENCES \`team\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup_message\` ADD CONSTRAINT \`FK_4ad72ce234f1cbaa9e7b924f072\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup_message\` ADD CONSTRAINT \`FK_f89aefadbe20491b32a761226d1\` FOREIGN KEY (\`matchupID\`) REFERENCES \`matchup\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup_score\` ADD CONSTRAINT \`FK_4bb1fb8db221ad4fbc0051008e5\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup_score\` ADD CONSTRAINT \`FK_4e1cbe446109f6c61576219f5f7\` FOREIGN KEY (\`mapID\`) REFERENCES \`matchup_map\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup_map\` ADD CONSTRAINT \`FK_66239baa2ee06ed2f7a00e6b724\` FOREIGN KEY (\`mapID\`) REFERENCES \`mappool_map\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup_map\` ADD CONSTRAINT \`FK_040496538cb713b0233be919fd6\` FOREIGN KEY (\`setID\`) REFERENCES \`matchup_set\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`team\` ADD CONSTRAINT \`FK_b567309778657df4f04db093279\` FOREIGN KEY (\`managerID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD CONSTRAINT \`FK_d837b180632c18af2322e473866\` FOREIGN KEY (\`organizerID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`stage\` ADD CONSTRAINT \`FK_c31ffe63e6de6c2718ae92a7422\` FOREIGN KEY (\`createdByID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`stage\` ADD CONSTRAINT \`FK_40a84786ce719424b15ab38e9c7\` FOREIGN KEY (\`tournamentID\`) REFERENCES \`tournament\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`round\` ADD CONSTRAINT \`FK_d1a278fd1c02d08ffb984189af0\` FOREIGN KEY (\`stageID\`) REFERENCES \`stage\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool\` ADD CONSTRAINT \`FK_12804c33b7cb1323ee54a9ae10e\` FOREIGN KEY (\`createdByID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool\` ADD CONSTRAINT \`FK_1542f1d5547fb8e2142309fbcf8\` FOREIGN KEY (\`stageID\`) REFERENCES \`stage\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_slot\` ADD CONSTRAINT \`FK_9bb2035c81dbe73e1f715b34641\` FOREIGN KEY (\`createdByID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_slot\` ADD CONSTRAINT \`FK_db1501100e2089e602531eb050b\` FOREIGN KEY (\`mappoolID\`) REFERENCES \`mappool\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`job_post\` ADD CONSTRAINT \`FK_ce8bbfda770c0e4f4efbdf12b46\` FOREIGN KEY (\`createdByID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` ADD CONSTRAINT \`FK_ecff4f807aff2921fbc1db4cf8b\` FOREIGN KEY (\`createdByID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` ADD CONSTRAINT \`FK_f7a0bafbeca589f8a546bcc525c\` FOREIGN KEY (\`createdByID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` ADD CONSTRAINT \`FK_e0fd6bfacfd88cbd77e4983689d\` FOREIGN KEY (\`slotID\`) REFERENCES \`mappool_slot\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`username_change\` ADD CONSTRAINT \`FK_375c55a3e9a6271ebda2623e2ca\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_statistics\` ADD CONSTRAINT \`FK_09b61b49529146fc1572abbc550\` FOREIGN KEY (\`modeDivisionID\`) REFERENCES \`mode_division\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_statistics\` ADD CONSTRAINT \`FK_fe8512e6f7cfc1589a44a72a82f\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_nominations_nomination\` ADD CONSTRAINT \`FK_c39e90811e78d3a759f9f75e37c\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`user_nominations_nomination\` ADD CONSTRAINT \`FK_2dc37a0c6b4f99e6e20c4903ae0\` FOREIGN KEY (\`nominationID\`) REFERENCES \`nomination\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_nominations_nomination\` DROP FOREIGN KEY \`FK_2dc37a0c6b4f99e6e20c4903ae0\``);
        await queryRunner.query(`ALTER TABLE \`user_nominations_nomination\` DROP FOREIGN KEY \`FK_c39e90811e78d3a759f9f75e37c\``);
        await queryRunner.query(`ALTER TABLE \`user_statistics\` DROP FOREIGN KEY \`FK_fe8512e6f7cfc1589a44a72a82f\``);
        await queryRunner.query(`ALTER TABLE \`user_statistics\` DROP FOREIGN KEY \`FK_09b61b49529146fc1572abbc550\``);
        await queryRunner.query(`ALTER TABLE \`username_change\` DROP FOREIGN KEY \`FK_375c55a3e9a6271ebda2623e2ca\``);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` DROP FOREIGN KEY \`FK_e0fd6bfacfd88cbd77e4983689d\``);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` DROP FOREIGN KEY \`FK_f7a0bafbeca589f8a546bcc525c\``);
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` DROP FOREIGN KEY \`FK_ecff4f807aff2921fbc1db4cf8b\``);
        await queryRunner.query(`ALTER TABLE \`job_post\` DROP FOREIGN KEY \`FK_ce8bbfda770c0e4f4efbdf12b46\``);
        await queryRunner.query(`ALTER TABLE \`mappool_slot\` DROP FOREIGN KEY \`FK_db1501100e2089e602531eb050b\``);
        await queryRunner.query(`ALTER TABLE \`mappool_slot\` DROP FOREIGN KEY \`FK_9bb2035c81dbe73e1f715b34641\``);
        await queryRunner.query(`ALTER TABLE \`mappool\` DROP FOREIGN KEY \`FK_1542f1d5547fb8e2142309fbcf8\``);
        await queryRunner.query(`ALTER TABLE \`mappool\` DROP FOREIGN KEY \`FK_12804c33b7cb1323ee54a9ae10e\``);
        await queryRunner.query(`ALTER TABLE \`round\` DROP FOREIGN KEY \`FK_d1a278fd1c02d08ffb984189af0\``);
        await queryRunner.query(`ALTER TABLE \`stage\` DROP FOREIGN KEY \`FK_40a84786ce719424b15ab38e9c7\``);
        await queryRunner.query(`ALTER TABLE \`stage\` DROP FOREIGN KEY \`FK_c31ffe63e6de6c2718ae92a7422\``);
        await queryRunner.query(`ALTER TABLE \`tournament\` DROP FOREIGN KEY \`FK_d837b180632c18af2322e473866\``);
        await queryRunner.query(`ALTER TABLE \`team\` DROP FOREIGN KEY \`FK_b567309778657df4f04db093279\``);
        await queryRunner.query(`ALTER TABLE \`matchup_map\` DROP FOREIGN KEY \`FK_040496538cb713b0233be919fd6\``);
        await queryRunner.query(`ALTER TABLE \`matchup_map\` DROP FOREIGN KEY \`FK_66239baa2ee06ed2f7a00e6b724\``);
        await queryRunner.query(`ALTER TABLE \`matchup_score\` DROP FOREIGN KEY \`FK_4e1cbe446109f6c61576219f5f7\``);
        await queryRunner.query(`ALTER TABLE \`matchup_score\` DROP FOREIGN KEY \`FK_4bb1fb8db221ad4fbc0051008e5\``);
        await queryRunner.query(`ALTER TABLE \`matchup_message\` DROP FOREIGN KEY \`FK_f89aefadbe20491b32a761226d1\``);
        await queryRunner.query(`ALTER TABLE \`matchup_message\` DROP FOREIGN KEY \`FK_4ad72ce234f1cbaa9e7b924f072\``);
        await queryRunner.query(`ALTER TABLE \`team_invite\` DROP FOREIGN KEY \`FK_ea34840060c37877446513060b1\``);
        await queryRunner.query(`ALTER TABLE \`team_invite\` DROP FOREIGN KEY \`FK_14775f5b9172d5acf3e5467b74c\``);
        await queryRunner.query(`ALTER TABLE \`tournament_role\` DROP FOREIGN KEY \`FK_6e42fb6285926f58915731a9476\``);
        await queryRunner.query(`ALTER TABLE \`tournament_role\` DROP FOREIGN KEY \`FK_3d7980b021649df8957d852d602\``);
        await queryRunner.query(`ALTER TABLE \`tournament_channel\` DROP FOREIGN KEY \`FK_ea3314cdbf262c321984d9c16a0\``);
        await queryRunner.query(`ALTER TABLE \`tournament_channel\` DROP FOREIGN KEY \`FK_9477807d96ff1c5e0489299f422\``);
        await queryRunner.query(`ALTER TABLE \`mappool_map_weight\` DROP FOREIGN KEY \`FK_0e04c219d2aaed067c03f3eb405\``);
        await queryRunner.query(`ALTER TABLE \`mappool_map_weight\` DROP FOREIGN KEY \`FK_451d2d1f81dc355dcf49f3839f5\``);
        await queryRunner.query(`ALTER TABLE \`mappool_map_skill\` DROP FOREIGN KEY \`FK_40c169a892e09dd925312b5d3ed\``);
        await queryRunner.query(`ALTER TABLE \`mappool_map_skill\` DROP FOREIGN KEY \`FK_0822af5af607323fcae9a3a8b01\``);
        await queryRunner.query(`ALTER TABLE \`mappool_map_history\` DROP FOREIGN KEY \`FK_4d71cb55c73a73e235eaa941a02\``);
        await queryRunner.query(`ALTER TABLE \`mappool_map_history\` DROP FOREIGN KEY \`FK_f2a5ef6ded9551679af2de6e05b\``);
        await queryRunner.query(`ALTER TABLE \`beatmapset\` DROP FOREIGN KEY \`FK_03d8487dc1b222d8b1bbb02967f\``);
        await queryRunner.query(`ALTER TABLE \`mca_eligibility\` DROP FOREIGN KEY \`FK_f338d32f7d34062acaeb1de0b80\``);
        await queryRunner.query(`ALTER TABLE \`demerit_report\` DROP FOREIGN KEY \`FK_8cc900fb5b596f03c0a390b6bd5\``);
        await queryRunner.query(`ALTER TABLE \`user_statistics\` CHANGE \`userID\` \`userID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`user_statistics\` CHANGE \`modeDivisionID\` \`modeDivisionID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`user_statistics\` ADD CONSTRAINT \`FK_fe8512e6f7cfc1589a44a72a82f\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_statistics\` ADD CONSTRAINT \`FK_09b61b49529146fc1572abbc550\` FOREIGN KEY (\`modeDivisionID\`) REFERENCES \`mode_division\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_comment\` CHANGE \`updatedAt\` \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`user\` CHANGE \`osuUserid\` \`osuUserid\` varchar(255) CHARACTER SET "utf8mb4" COLLATE "utf8mb4_general_ci" NULL`);
        await queryRunner.query(`ALTER TABLE \`username_change\` CHANGE \`userID\` \`userID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`username_change\` ADD CONSTRAINT \`FK_375c55a3e9a6271ebda2623e2ca\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` CHANGE \`slotID\` \`slotID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` CHANGE \`createdByID\` \`createdByID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` ADD CONSTRAINT \`FK_e0fd6bfacfd88cbd77e4983689d\` FOREIGN KEY (\`slotID\`) REFERENCES \`mappool_slot\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_map\` ADD CONSTRAINT \`FK_f7a0bafbeca589f8a546bcc525c\` FOREIGN KEY (\`createdByID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` CHANGE \`createdByID\` \`createdByID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_replay\` ADD CONSTRAINT \`FK_ecff4f807aff2921fbc1db4cf8b\` FOREIGN KEY (\`createdByID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`job_post\` CHANGE \`createdByID\` \`createdByID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`job_post\` ADD CONSTRAINT \`FK_ce8bbfda770c0e4f4efbdf12b46\` FOREIGN KEY (\`createdByID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_slot\` CHANGE \`mappoolID\` \`mappoolID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_slot\` CHANGE \`createdByID\` \`createdByID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_slot\` ADD CONSTRAINT \`FK_db1501100e2089e602531eb050b\` FOREIGN KEY (\`mappoolID\`) REFERENCES \`mappool\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_slot\` ADD CONSTRAINT \`FK_9bb2035c81dbe73e1f715b34641\` FOREIGN KEY (\`createdByID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool\` CHANGE \`stageID\` \`stageID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool\` CHANGE \`createdByID\` \`createdByID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool\` ADD CONSTRAINT \`FK_1542f1d5547fb8e2142309fbcf8\` FOREIGN KEY (\`stageID\`) REFERENCES \`stage\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool\` ADD CONSTRAINT \`FK_12804c33b7cb1323ee54a9ae10e\` FOREIGN KEY (\`createdByID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`round\` CHANGE \`stageID\` \`stageID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`round\` ADD CONSTRAINT \`FK_d1a278fd1c02d08ffb984189af0\` FOREIGN KEY (\`stageID\`) REFERENCES \`stage\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`stage\` CHANGE \`tournamentID\` \`tournamentID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`stage\` CHANGE \`createdByID\` \`createdByID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`stage\` ADD CONSTRAINT \`FK_40a84786ce719424b15ab38e9c7\` FOREIGN KEY (\`tournamentID\`) REFERENCES \`tournament\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`stage\` ADD CONSTRAINT \`FK_c31ffe63e6de6c2718ae92a7422\` FOREIGN KEY (\`createdByID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tournament\` CHANGE \`organizerID\` \`organizerID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament\` ADD CONSTRAINT \`FK_d837b180632c18af2322e473866\` FOREIGN KEY (\`organizerID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`team\` CHANGE \`managerID\` \`managerID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`team\` ADD CONSTRAINT \`FK_b567309778657df4f04db093279\` FOREIGN KEY (\`managerID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup_map\` CHANGE \`setID\` \`setID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`matchup_map\` CHANGE \`mapID\` \`mapID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`matchup_map\` ADD CONSTRAINT \`FK_040496538cb713b0233be919fd6\` FOREIGN KEY (\`setID\`) REFERENCES \`matchup_set\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup_map\` ADD CONSTRAINT \`FK_66239baa2ee06ed2f7a00e6b724\` FOREIGN KEY (\`mapID\`) REFERENCES \`mappool_map\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup_score\` CHANGE \`mapID\` \`mapID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`matchup_score\` CHANGE \`userID\` \`userID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`matchup_score\` ADD CONSTRAINT \`FK_4e1cbe446109f6c61576219f5f7\` FOREIGN KEY (\`mapID\`) REFERENCES \`matchup_map\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup_score\` ADD CONSTRAINT \`FK_4bb1fb8db221ad4fbc0051008e5\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup_message\` CHANGE \`matchupID\` \`matchupID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`matchup_message\` CHANGE \`userID\` \`userID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`matchup_message\` ADD CONSTRAINT \`FK_f89aefadbe20491b32a761226d1\` FOREIGN KEY (\`matchupID\`) REFERENCES \`matchup\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`matchup_message\` ADD CONSTRAINT \`FK_4ad72ce234f1cbaa9e7b924f072\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`team_invite\` CHANGE \`teamID\` \`teamID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`team_invite\` CHANGE \`userID\` \`userID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`team_invite\` ADD CONSTRAINT \`FK_ea34840060c37877446513060b1\` FOREIGN KEY (\`teamID\`) REFERENCES \`team\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`team_invite\` ADD CONSTRAINT \`FK_14775f5b9172d5acf3e5467b74c\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tournament_role\` CHANGE \`tournamentID\` \`tournamentID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament_role\` CHANGE \`createdByID\` \`createdByID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament_role\` ADD CONSTRAINT \`FK_6e42fb6285926f58915731a9476\` FOREIGN KEY (\`tournamentID\`) REFERENCES \`tournament\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tournament_role\` ADD CONSTRAINT \`FK_3d7980b021649df8957d852d602\` FOREIGN KEY (\`createdByID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tournament_channel\` CHANGE \`tournamentID\` \`tournamentID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament_channel\` CHANGE \`createdByID\` \`createdByID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`tournament_channel\` ADD CONSTRAINT \`FK_ea3314cdbf262c321984d9c16a0\` FOREIGN KEY (\`tournamentID\`) REFERENCES \`tournament\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tournament_channel\` ADD CONSTRAINT \`FK_9477807d96ff1c5e0489299f422\` FOREIGN KEY (\`createdByID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_weight\` CHANGE \`mappoolMapID\` \`mappoolMapID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_weight\` CHANGE \`userID\` \`userID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_weight\` ADD CONSTRAINT \`FK_0e04c219d2aaed067c03f3eb405\` FOREIGN KEY (\`mappoolMapID\`) REFERENCES \`mappool_map\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_weight\` ADD CONSTRAINT \`FK_451d2d1f81dc355dcf49f3839f5\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_skill\` CHANGE \`mappoolMapID\` \`mappoolMapID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_skill\` CHANGE \`userID\` \`userID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_skill\` ADD CONSTRAINT \`FK_40c169a892e09dd925312b5d3ed\` FOREIGN KEY (\`mappoolMapID\`) REFERENCES \`mappool_map\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_skill\` ADD CONSTRAINT \`FK_0822af5af607323fcae9a3a8b01\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_history\` CHANGE \`mappoolMapID\` \`mappoolMapID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_history\` CHANGE \`createdByID\` \`createdByID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_history\` ADD CONSTRAINT \`FK_4d71cb55c73a73e235eaa941a02\` FOREIGN KEY (\`mappoolMapID\`) REFERENCES \`mappool_map\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mappool_map_history\` ADD CONSTRAINT \`FK_f2a5ef6ded9551679af2de6e05b\` FOREIGN KEY (\`createdByID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`beatmapset\` CHANGE \`creatorID\` \`creatorID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`beatmapset\` ADD CONSTRAINT \`FK_03d8487dc1b222d8b1bbb02967f\` FOREIGN KEY (\`creatorID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`mca_eligibility\` CHANGE \`userID\` \`userID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`mca_eligibility\` ADD CONSTRAINT \`FK_f338d32f7d34062acaeb1de0b80\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`demerit_report\` CHANGE \`userID\` \`userID\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`demerit_report\` ADD CONSTRAINT \`FK_8cc900fb5b596f03c0a390b6bd5\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_0b5e8f4ec5a4bf0497c8762129\` ON \`mappool_map\` (\`replayID\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_2627a9eac7586470ddf3a13823\` ON \`mappool_map\` (\`jobPostID\`)`);
        await queryRunner.query(`ALTER TABLE \`user_nominations_nomination\` ADD CONSTRAINT \`FK_c39e90811e78d3a759f9f75e37c\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_nominations_nomination\` ADD CONSTRAINT \`FK_2dc37a0c6b4f99e6e20c4903ae0\` FOREIGN KEY (\`nominationID\`) REFERENCES \`nomination\`(\`ID\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
