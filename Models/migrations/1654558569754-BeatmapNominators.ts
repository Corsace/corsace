import { createReadStream } from "fs";
import {MigrationInterface, QueryRunner} from "typeorm";
import { createGunzip } from "zlib";
import streamToString from "stream-to-string";
import { resolve } from "path";
import { OAuth, User } from "../user";

const missingUser = {
    username: "Enneya",
    userID: 10959501,
    country: "BE",
    setIDs: [
        1224699,
        1061572,
        1213339,
        982104,
        1250030,
        1009447,
        1261295,
        1249344,
        946155,
        1190716,
        1250546,
        1155217,
        1242733,
        1118283,
        1255210,
        1233752,
        1206933,
        1233950,
        1204933,
        872150,
        1293912,
        973844,
        1242515,
        1178098,
        1001825,
        1317896,
        1128882,
        1254404,
        1292185,
        1153893
    ]
}

export class BeatmapNominators1654558569754 implements MigrationInterface {
    name = 'BeatmapNominators1654558569754'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`user_maps_ranked_beatmapset\` (\`userID\` int NOT NULL, \`beatmapsetID\` int NOT NULL, INDEX \`IDX_3cda7daeb4ff2b0dbc4b90736c\` (\`userID\`), INDEX \`IDX_f0b456f4502aebcbfd9233edf7\` (\`beatmapsetID\`), PRIMARY KEY (\`userID\`, \`beatmapsetID\`)) ENGINE=InnoDB`);
        const bigSql = await streamToString(createReadStream(resolve(__dirname, "1654558569754-BeatmapNominators.sql.gz")).pipe(createGunzip()));
        const sqlInstructions = bigSql.split("\n").filter(sql => sql.trim().length !== 0);
        for(const sqlInstruction of sqlInstructions)
            if(sqlInstruction.trim().length !== 0)
                await queryRunner.query(sqlInstruction);
        
        let user = await queryRunner.manager
            .createQueryBuilder()
            .from(User, "user")
            .leftJoin("user.otherNames", "otherName")
            .where("user.osuUserid = :userId", { userId: missingUser.userID })
            .orWhere("user.osuUsername = :username")
            .orWhere("otherName.name = :username")
            .setParameter("username", missingUser.username)
            .getOne();
        if (!user) {
            console.log("creating missing user", missingUser.userID, missingUser.username);
    
            user = new User();
            user.osu = new OAuth();
            user.osu.username = missingUser.username;
            user.osu.userID = `${missingUser.userID}`;
            user.country = missingUser.country;
            await queryRunner.manager.save(user);
        }
        
        for (const setID of missingUser.setIDs)
            await queryRunner.query(`INSERT INTO \`user_maps_ranked_beatmapset\` (\`userID\`, \`beatmapsetID\`) VALUES (${user.ID},${setID})`);

        await queryRunner.query(`ALTER TABLE \`user_maps_ranked_beatmapset\` ADD CONSTRAINT \`FK_3cda7daeb4ff2b0dbc4b90736ca\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`user_maps_ranked_beatmapset\` ADD CONSTRAINT \`FK_f0b456f4502aebcbfd9233edf70\` FOREIGN KEY (\`beatmapsetID\`) REFERENCES \`beatmapset\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_maps_ranked_beatmapset\` DROP FOREIGN KEY \`FK_f0b456f4502aebcbfd9233edf70\``);
        await queryRunner.query(`ALTER TABLE \`user_maps_ranked_beatmapset\` DROP FOREIGN KEY \`FK_3cda7daeb4ff2b0dbc4b90736ca\``);
        await queryRunner.query(`DROP INDEX \`IDX_f0b456f4502aebcbfd9233edf7\` ON \`user_maps_ranked_beatmapset\``);
        await queryRunner.query(`DROP INDEX \`IDX_3cda7daeb4ff2b0dbc4b90736c\` ON \`user_maps_ranked_beatmapset\``);
        await queryRunner.query(`DROP TABLE \`user_maps_ranked_beatmapset\``);
    }

}
