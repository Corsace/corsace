import {MigrationInterface, QueryRunner} from "typeorm";
import { Influence } from "../MCA_AYIM/influence";
import { OAuth, User } from "../user";
import { UsernameChange } from "../usernameChange";
import output from "./1642311161985-influencesSeed.json";

export class SeedInfluenceTable1642311161985 implements MigrationInterface {
    name = "SeedInfluenceTable1642311161985"

    public async up (queryRunner: QueryRunner): Promise<void> {
        const rawData: any = output;
        let missingUserId = 10000001;
        const missingUsers: any[] = [];
        
        // Fill missing users and username changes
        for (const item of rawData) {
            const query = queryRunner.manager
                .createQueryBuilder()
                .from(User, "user")
                .leftJoin("user.otherNames", "otherName")
                .where("user.osuUserid = :userId", { userId: item.userId });

            if (item.username) {
                query.orWhere("user.osuUsername = :username")
                    .orWhere("otherName.name = :username")
                    .setParameter("username", item.username);
            }

            if (item.alt) {
                query
                    .orWhere("user.osuUsername = :altUsername")
                    .orWhere("otherName.name = :altUsername")
                    .setParameter("altUsername", item.alt);
            }

            let user = await query.select(["user", "otherName"]).getOne();
        
            if (user && item.username && item.username !== user.osu.username && !user.otherNames.some(n => n.name === item.username)) {
                const name = new UsernameChange();
                name.name = item.username;
                name.user = user;
                await queryRunner.manager.save(name);
            }

            if (user && item.alt && item.alt !== user.osu.username && !user.otherNames.some(n => n.name === item.alt)) {
                const name = new UsernameChange();
                name.name = item.alt;
                name.user = user;
                await queryRunner.manager.save(name);
            }

            if (!user) {
                console.log("creating user", item.userId, item.username);
                missingUsers.push(item);
                
                user = new User();
                user.osu = new OAuth();
                user.osu.username = item.username || "unknown";
                user.osu.userID = item.userId || (missingUserId++).toString();
                user.country = item.country;
                await queryRunner.manager.save(user);
            }

            item.id = user.ID;
        }

        const missingInfluences: any[] = [];

        // Fill influences
        for (const item of rawData) {
            for (const itemInfluence of item.influences) {
                const newInfluence = new Influence();
                newInfluence.user = item.id;

                const dbInfluence = await queryRunner.manager
                    .createQueryBuilder()
                    .from(User, "user")
                    .leftJoin("user.otherNames", "otherName")
                    .where("user.osuUsername = :username")
                    .orWhere("otherName.name = :username")
                    .setParameter("username", itemInfluence)
                    .select(["user", "otherName"])
                    .getOne();
                
                if (!dbInfluence) {
                    console.log("couldnt find influence", itemInfluence);
                    missingInfluences.push(itemInfluence);
                } else {
                    newInfluence.influence = dbInfluence;
                    await queryRunner.manager.save(newInfluence);
                }
            }
        }

        console.log(missingUsers.length, "created users");
        console.log(missingInfluences.length, "influences not created", missingInfluences.join(", "));
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        //
    }

}
