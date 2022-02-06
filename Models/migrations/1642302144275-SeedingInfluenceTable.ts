import {MigrationInterface, QueryRunner} from "typeorm";
import { Influence } from "../MCA_AYIM/influence";
import { ModeDivision } from "../MCA_AYIM/modeDivision";
import { OAuth, User } from "../user";
import { UsernameChange } from "../usernameChange";
import output from "./1642302144275-SeedingInfluenceTable.json";

export class SeedingInfluenceTable1642302144275 implements MigrationInterface {
    name = "SeedingInfluenceTable1642302144275"

    public async up (queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`influence\` (\`ID\` int NOT NULL AUTO_INCREMENT, \`year\` year NOT NULL, \`rank\` int NOT NULL, \`comment\` text NULL, \`isValid\` tinyint NOT NULL DEFAULT 0, \`lastReviewedAt\` datetime NULL, \`userID\` int NOT NULL, \`influenceID\` int NOT NULL, \`modeID\` int NOT NULL, \`reviewerID\` int NULL, PRIMARY KEY (\`ID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`influence\` ADD CONSTRAINT \`FK_feddb1198a3f7fd89dd8207e7f6\` FOREIGN KEY (\`userID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`influence\` ADD CONSTRAINT \`FK_3d99ed61b7beae928a1935202e3\` FOREIGN KEY (\`influenceID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`influence\` ADD CONSTRAINT \`FK_55fef2fbf5e7e0be2651720597a\` FOREIGN KEY (\`modeID\`) REFERENCES \`mode_division\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`influence\` ADD CONSTRAINT \`FK_e02ea869b5aa8a00eb850216316\` FOREIGN KEY (\`reviewerID\`) REFERENCES \`user\`(\`ID\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);

        const rawData: any = output;
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
                user.osu.username = item.username;
                user.osu.userID = item.userId;
                user.country = item.country;
                await queryRunner.manager.save(user);
            }

            item.id = user.ID;
        }

        const missingInfluences: any[] = [];
        const standardMode = await ModeDivision.findOne(1);
        if (!standardMode)
            throw "Could not find the standard mode division. There may have been an issue with a previous migration that inserts this!";

        // Fill influences
        for (const item of rawData) {
            for (let i = 0; i < item.influences.length; i++) {
                const itemInfluence = item.influences[i];
                const newInfluence = new Influence();
                newInfluence.user = item.id;
                newInfluence.year = 2018;
                newInfluence.mode = standardMode;
                newInfluence.rank = i + 1;

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
                    console.log("couldn't find influence", itemInfluence);
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
        await queryRunner.query(`ALTER TABLE \`influence\` DROP FOREIGN KEY \`FK_e02ea869b5aa8a00eb850216316\``);
        await queryRunner.query(`ALTER TABLE \`influence\` DROP FOREIGN KEY \`FK_55fef2fbf5e7e0be2651720597a\``);
        await queryRunner.query(`ALTER TABLE \`influence\` DROP FOREIGN KEY \`FK_3d99ed61b7beae928a1935202e3\``);
        await queryRunner.query(`ALTER TABLE \`influence\` DROP FOREIGN KEY \`FK_feddb1198a3f7fd89dd8207e7f6\``);
        await queryRunner.query(`DROP TABLE \`influence\``);
    }

}
