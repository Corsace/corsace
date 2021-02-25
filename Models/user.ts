
import { Entity, Column, BaseEntity, PrimaryGeneratedColumn, CreateDateColumn, OneToMany, JoinTable, Brackets } from "typeorm";
import { DemeritReport } from "./demerits";
import { MCAEligibility } from "./MCA_AYIM/mcaEligibility";
import { GuestRequest } from "./MCA_AYIM/guestRequest";
import { UserComment } from "./MCA_AYIM/userComments";
import { UsernameChange } from "./usernameChange";
import { Nomination } from "./MCA_AYIM/nomination";
import { Vote } from "./MCA_AYIM/vote";
import { Beatmapset } from "./beatmapset";
import { config } from "node-config-ts";
import { GuildMember } from "discord.js";
import { discordGuild } from "../Server/discord";
import { UserCondensedInfo, UserInfo, UserMCAInfo } from "../Interfaces/user";
import { Category } from "../Interfaces/category";
import { MapperQuery, StageQuery } from "../Interfaces/queries";
import { ModeDivisionType } from "./MCA_AYIM/modeDivision";

// General middlewares

export class OAuth {

    @Column({ default: null })
    userID!: string;

    @Column({ default: "" })
    username!: string;
    
    @Column({ default: "" })
    avatar!: string;

    @Column({ type: "longtext", nullable: true })
    accessToken?: string;

    @Column({ type: "longtext", nullable: true })
    refreshToken?: string;

    @CreateDateColumn()
    dateAdded!: Date;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    lastVerified!: Date;

}

@Entity()
export class User extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column(() => OAuth)
    discord!: OAuth;
    
    @Column(() => OAuth)
    osu!: OAuth;

    @CreateDateColumn()
    registered!: Date;
    
    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    lastLogin!: Date;

    @OneToMany(() => UsernameChange, change => change.user, {
        eager: true,
    })
    otherNames!: UsernameChange[];

    @OneToMany(() => DemeritReport, demerit => demerit.user, {
        eager: true,
    })
    demerits!: DemeritReport[];

    @OneToMany(() => GuestRequest, guestRequest => guestRequest.user, {
        eager: true,
    })
    guestRequests!: GuestRequest[];

    @OneToMany(() => MCAEligibility, eligibility => eligibility.user, {
        eager: true,
    })
    @JoinTable()
    mcaEligibility!: MCAEligibility[];

    @OneToMany(() => Beatmapset, set => set.creator)
    beatmapsets!: Beatmapset[];

    @OneToMany(() => UserComment, userComment => userComment.commenter)
    commentsMade!: UserComment[];

    @OneToMany(() => UserComment, userComment => userComment.target)
    commentsReceived!: UserComment[];

    @OneToMany(() => UserComment, userComment => userComment.reviewer)
    commentReviews!: UserComment[];

    @OneToMany(() => Nomination, userComment => userComment.reviewer)
    nominationReviews!: Nomination[];

    @Column({ default: true })
    canComment!: boolean;
    
    @OneToMany(() => Nomination, nomination => nomination.nominator)
    nominations!: Nomination[];
    
    @OneToMany(() => Nomination, nomination => nomination.user)
    nominationsReceived!: Nomination[];

    @OneToMany(() => Vote, vote => vote.voter)
    votes!: Vote[];
    
    @OneToMany(() => Vote, vote => vote.user)
    votesReceived!: Vote[];

    static basicSearch (query: MapperQuery) {
        const queryBuilder = User
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.otherNames", "otherName")
            .leftJoinAndSelect("user.mcaEligibility", "mca")
            .where(`mca.year = :q`, { q: parseInt(query.year) });

        if (query.mode in ModeDivisionType) {
            queryBuilder.andWhere(`mca.${query.mode} = true`);
        }

        // Check for search text
        if (query.text) {
            queryBuilder
                .andWhere(new Brackets(qb => {
                    qb.where("user.osuUsername LIKE :criteria")
                        .orWhere("user.osuUserid LIKE :criteria")
                        .orWhere("otherName.name LIKE :criteria");
                }))
                .setParameter("criteria", `%${query.text}%`);
        }
            
        // Search
        return queryBuilder
            .skip(parseInt(query.skip))
            .take(50)
            .orderBy("user_osuUsername", "DESC")
            .getMany();
    }

    static search (year: number, modeString: string, stage: "voting" | "nominating", category: Category, query: StageQuery): Promise<[User[], number]> {
        // Initial repo setup
        const queryBuilder = User.createQueryBuilder("user");
            
        if (stage === "voting") {
            queryBuilder
                .innerJoinAndSelect(
                    "user.nominationsReceived", 
                    "nominationReceived", 
                    "nominationReceived.isValid = true AND nominationReceived.categoryID = :categoryId", 
                    { categoryId: category.ID }
                );
        }

        queryBuilder
            .leftJoinAndSelect("user.otherNames", "otherName")
            .leftJoinAndSelect("user.mcaEligibility", "mca")
            .where(`mca.year = :q AND mca.${modeString} = 1`, { q: year });

        if (category.filter?.rookie) {
            queryBuilder
                .andWhere((qb) => {
                    const subQuery = qb.subQuery()
                        .from(MCAEligibility, "mcaEligibility")
                        .where("year < :year", { year: year })
                        .andWhere("userID = user.ID")
                        .andWhere(`mca.${modeString} = 1`)
                        .getQuery();

                    return "NOT EXISTS " + subQuery;
                });
        }
        
        // Check for search text
        if (query.text) {
            queryBuilder
                .andWhere(new Brackets(qb => {
                    qb.where("user.osuUsername LIKE :criteria")
                        .orWhere("user.osuUserid LIKE :criteria")
                        .orWhere("otherName.name LIKE :criteria");
                }))
                .setParameter("criteria", `%${query.text}%`);
        }
        
        // Ordering
        const ascDesc = query.order || "ASC";
        let orderMethod = "CAST(user_osuUserid AS UNSIGNED)";
        if (query.option.toLowerCase().includes("alph"))
            orderMethod = "user_osuUsername";
            
        // Search
        return Promise.all([
            queryBuilder
                .skip(query.skip)
                .take(50)
                .orderBy(orderMethod, ascDesc)
                .getMany(),

            queryBuilder.getCount(),
        ]);
    }

    public getCondensedInfo = function(this: User, chosen = false): UserCondensedInfo {
        return {
            corsaceID: this.ID,
            avatar: this.osu.avatar + "?" + Math.round(Math.random() * 1000000),
            userID: this.osu.userID,
            username: this.osu.username,
            otherNames: this.otherNames.map(otherName => otherName.name),
            chosen,
        };
    }
    
    public getInfo = async function(this: User): Promise<UserInfo> {
        let member: GuildMember | undefined;
        if (this.discord?.userID)
            member = await (await discordGuild()).members.fetch(this.discord.userID);
        const info: UserInfo = {
            corsaceID: this.ID,
            discord: {
                avatar: "https://cdn.discordapp.com/avatars/" + this.discord.userID + "/" + this.discord.avatar + ".png",
                userID: this.discord.userID,
                username: this.discord.username,
            },
            osu: {
                avatar: this.osu.avatar + "?" + Math.round(Math.random() * 1000000),
                userID: this.osu.userID,
                username: this.osu.username,
                otherNames: this.otherNames.map(otherName => otherName.name),
            },
            staff: {
                corsace: member ? member.roles.cache.has(config.discord.roles.corsace.corsace) : false,
                headStaff: member ? member.roles.cache.has(config.discord.roles.corsace.headStaff) : false,
                staff: member ? member.roles.cache.has(config.discord.roles.corsace.staff) : false,
            },
            joinDate: this.registered,
            lastLogin: this.lastLogin,
            canComment: this.canComment,
        };
        return info;
    }

    public getMCAInfo = async function(this: User): Promise<UserMCAInfo> {
        let member: GuildMember | undefined;
        if (this.discord?.userID)
            member = await (await discordGuild()).members.fetch(this.discord.userID);
        const mcaInfo: UserMCAInfo = await this.getInfo() as UserMCAInfo;
        mcaInfo.guestRequests = this.guestRequests,
        mcaInfo.eligibility = this.mcaEligibility,
        mcaInfo.mcaStaff = {
            standard: member ? member.roles.cache.has(config.discord.roles.mca.standard) : false,
            taiko: member ? member.roles.cache.has(config.discord.roles.mca.taiko) : false,
            fruits: member ? member.roles.cache.has(config.discord.roles.mca.fruits) : false,
            mania: member ? member.roles.cache.has(config.discord.roles.mca.mania) : false,
            storyboard: member ? member.roles.cache.has(config.discord.roles.mca.storyboard) : false,
        };

        return mcaInfo;
    }
}
