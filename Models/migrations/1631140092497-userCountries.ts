import { createReadStream } from "fs";
import {MigrationInterface, QueryRunner} from "typeorm";
import { createGunzip } from "zlib";
import streamToString from "stream-to-string";
import { resolve } from "path";

import { osuClient } from "../../Server/osu";
import { User } from "../user";
import { User as APIUser } from "nodesu";

export class userCountries1631140092497 implements MigrationInterface {
    name = "userCountries1631140092497"

    public async up (queryRunner: QueryRunner): Promise<void> {
        // Old migration code, super slow and doesn't work for restricted users
        if (process.env.NODE_ENV === "production") {
            await queryRunner.query("ALTER TABLE `user` ADD `country` tinytext NOT NULL");

            const users = await User
                .createQueryBuilder("user")
                .getMany();

            await Promise.all(users.map(async user => {
                const apiUser = (await osuClient.user.get(user.osu.userID)) as APIUser;
                user.country = apiUser.country.toString();
                return user.save();
            }));
        } else {
            const bigSql = await streamToString(createReadStream(resolve(__dirname, "1631140092497-userCountries.sql.gz")).pipe(createGunzip()));
            const sqlInstructions = bigSql.split("\n").filter(sql => sql.trim().length !== 0);
            for(const sqlInstruction of sqlInstructions)
                if(sqlInstruction.trim().length !== 0)
                    await queryRunner.query(sqlInstruction);
        }
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user` DROP COLUMN `country`");
    }

}
