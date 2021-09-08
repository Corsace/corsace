import {MigrationInterface, QueryRunner} from "typeorm";
import { osuClient } from "../../Server/osu";
import { User } from "../user";
import { User as APIUser } from "nodesu";

export class userCountries1631140092497 implements MigrationInterface {
    name = "userCountries1631140092497"

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user` ADD `country` tinytext NOT NULL");

        const users = await User
            .createQueryBuilder("user")
            .getMany();

        await Promise.all(users.map(async user => {
            const apiUser = (await osuClient.user.get(user.osu.userID)) as APIUser;
            user.country = apiUser.country.toString();
            return user.save();
        }));
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user` DROP COLUMN `country`");
    }

}
