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
        
        // Fill missing users and username changes
        for (const item of rawData) {
            let user: User | undefined;
        
            if (item.userId) {
                user = await queryRunner.manager
                    .createQueryBuilder()
                    .select("ID")
                    .from(User, "user")
                    .where("user.osuUserID = :value", { value: item.userId })
                    .getOne();
            }

            if (user && item.username !== user.osu.username) {
                const name = new UsernameChange();
                name.name = item.username;
                name.user = user;
                await queryRunner.manager.save(name);
            }
            
            if (!user && item.username) {
                user = await queryRunner.manager
                    .createQueryBuilder()
                    .select("ID")
                    .from(User, "user")
                    .where("user.osuUsername = :value", { value: item.username })
                    .getOne();
            }

            if (!user) {
                console.log("creating user", item.userId, item.username);
                
                user = new User();
                user.osu = new OAuth();
                user.osu.username = item.username || "unknown";
                user.osu.userID = item.userId || (missingUserId++).toString();
                user.country = item.country;
                await queryRunner.manager.save(user);
            }

            if (item.alt) {
                const altExists = await queryRunner.manager
                    .createQueryBuilder()
                    .select("ID")
                    .from(User, "user")
                    .where("user.osuUsername = :value", { value: item.alt })
                    .getOne();

                if (!altExists) {
                    let name = await queryRunner.manager
                        .createQueryBuilder()
                        .select("ID")
                        .from(UsernameChange, "username_change")
                        .where("username_change.name = :value", { value: item.alt })
                        .getOne();
        
                    if (!name) {
                        console.log("creating namechange", item.alt, item.username);
                        
                        name = new UsernameChange();
                        name.name = item.alt;
                        name.user = user;
                        await queryRunner.manager.save(name);
                    }
                }
            }

            item.id = user.ID;
        }

        // Fill influences
        for (const item of rawData) {
            for (const itemInfluence of item.influences) {
                const newInfluence = new Influence();
                newInfluence.user = item.id;

                let dbInfluence = await queryRunner.manager
                    .createQueryBuilder()
                    .select("ID")
                    .from(User, "user")
                    .where("user.osuUsername = :value", { value: itemInfluence })
                    .getOne();
                
                if (!dbInfluence) {
                    const names = await queryRunner.manager
                        .createQueryBuilder()
                        .from(UsernameChange, "username_change")
                        .leftJoin("username_change.user", "user")
                        .where("username_change.name = :value", { value: itemInfluence })
                        .getMany();
                    
                    for (const name of names) {
                        dbInfluence = await queryRunner.manager
                            .createQueryBuilder()
                            .select("ID")
                            .from(User, "user")
                            .where("user.ID = :value", { value: name.user.ID })
                            .getOne();

                        if (dbInfluence) {
                            break;
                        }
                    }
                }

                if (!dbInfluence) {
                    console.log("couldnt find influence", itemInfluence);
                    continue;
                }

                newInfluence.influence = dbInfluence;
                await queryRunner.manager.save(newInfluence);
            }
        }
    }

    public async down (queryRunner: QueryRunner): Promise<void> {
        //
    }

}
