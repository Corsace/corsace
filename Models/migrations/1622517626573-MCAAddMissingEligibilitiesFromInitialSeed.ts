import {MigrationInterface, QueryRunner} from "typeorm";

export class MCAAddMissingEligibilitiesFromInitialSeed1622517626573 implements MigrationInterface {

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("INSERT INTO `mca_eligibility` (`ID`, `year`, `standard`, `taiko`, `fruits`, `mania`, `storyboard`, `userID`) VALUES (7477, 2009, 1, 0, 0, 0, 1, 27),(7478, 2010, 1, 0, 0, 0, 1, 185),(7479, 2017, 1, 0, 0, 0, 1, 492),(7480, 2018, 1, 0, 0, 0, 1, 933),(7481, 2017, 1, 0, 0, 0, 1, 1130),(7482, 2019, 0, 0, 1, 0, 1, 1342),(7483, 2015, 0, 0, 0, 1, 1, 1531),(7484, 2017, 1, 0, 0, 0, 1, 1538),(7485, 2018, 1, 0, 0, 0, 1, 1659),(7486, 2017, 0, 0, 1, 0, 1, 1792),(7487, 2018, 1, 0, 0, 0, 1, 1876),(7488, 2016, 1, 0, 0, 0, 1, 1892),(7489, 2017, 0, 0, 0, 1, 1, 1894),(7490, 2017, 0, 0, 0, 1, 1, 1961),(7491, 2016, 1, 0, 0, 0, 1, 1973),(7492, 2017, 1, 0, 0, 0, 1, 2091),(7493, 2019, 1, 0, 0, 0, 1, 2343),(7494, 2018, 1, 0, 0, 0, 1, 2491),(7495, 2018, 1, 0, 0, 0, 1, 2531),(7496, 2018, 0, 1, 0, 0, 1, 2564),(7497, 2020, 1, 0, 0, 0, 1, 2648),(7498, 2020, 1, 0, 0, 0, 1, 2684),(7499, 2019, 1, 0, 0, 0, 1, 2688),(7500, 2020, 0, 1, 0, 0, 1, 2777)");
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        for (let i = 7477; i < 7501; i++)
            await queryRunner.query("DELETE FROM `mca_eligibility` WHERE ID = " + i);
    }

}
