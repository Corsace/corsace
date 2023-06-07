
import { Entity, Column, BaseEntity, PrimaryGeneratedColumn, CreateDateColumn, OneToMany, JoinTable, Brackets, Index, ManyToMany } from "typeorm";
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
import { getMember } from "../Server/discord";
import { UserChoiceInfo, UserInfo, UserMCAInfo } from "../Interfaces/user";
import { Category } from "../Interfaces/category";
import { MapperQuery, StageQuery } from "../Interfaces/queries";
import { ModeDivisionType } from "./MCA_AYIM/modeDivision";
import { Influence } from "./MCA_AYIM/influence";
import { Tournament } from "./tournaments/tournament";
import { MappoolMap } from "./tournaments/mappools/mappoolMap";
import { MappoolMapSkill } from "./tournaments/mappools/mappoolMapSkill";
import { MappoolMapWeight } from "./tournaments/mappools/mappoolMapWeight";
import { TournamentChannel } from "./tournaments/tournamentChannel";
import { TournamentRole } from "./tournaments/tournamentRole";
import { Stage } from "./tournaments/stage";
import { Mappool } from "./tournaments/mappools/mappool";
import { MappoolSlot } from "./tournaments/mappools/mappoolSlot";
import { MappoolMapHistory } from "./tournaments/mappools/mappoolMapHistory";
import { JobPost } from "./tournaments/mappools/jobPost";
import { Team } from "./tournaments/team";
import { osuV2Client } from "../Server/osu";
import { bwsFilter } from "../Interfaces/osuAPIV2";
import { TeamInvite } from "./tournaments/teamInvite";

// General middlewares

export class OAuth {

    @Column({ default: null })
        userID!: string;

    @Index()
    @Column({ default: "" })
        username!: string;
    
    @Column({ default: "" })
        avatar!: string;

    @Column({ type: "longtext", nullable: true, select: false })
        accessToken?: string;

    @Column({ type: "longtext", nullable: true, select: false })
        refreshToken?: string;

    @CreateDateColumn()
        dateAdded!: Date;

    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
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

    @Column({ type: "tinytext" })
        country!: string;

    @CreateDateColumn()
        registered!: Date;
    
    @Column({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
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
    
    @ManyToMany(() => Nomination, nomination => nomination.nominators)
    @JoinTable()
        nominations!: Nomination[];
    
    @OneToMany(() => Nomination, nomination => nomination.user)
        nominationsReceived!: Nomination[];

    @OneToMany(() => Vote, vote => vote.voter)
        votes!: Vote[];
    
    @OneToMany(() => Vote, vote => vote.user)
        votesReceived!: Vote[];

    @ManyToMany(() => Beatmapset, set => set.rankers)
    @JoinTable()
        mapsRanked!: Beatmapset[];
    
    @OneToMany(() => Influence, influence => influence.user)
        influences!: Influence[];
    
    @OneToMany(() => Influence, influence => influence.influence)
        influencing!: Influence[];

    @OneToMany(() => Influence, influence => influence.reviewer)
        influenceReviews!: Influence[];

    @OneToMany(() => Tournament, tournament => tournament.organizer)
        tournamentsOrganized!: Tournament[];

    @ManyToMany(() => MappoolMap, mappoolMap => mappoolMap.customMappers)
        customMaps!: MappoolMap[];

    @ManyToMany(() => MappoolMap, mappoolMap => mappoolMap.testplayers)
        customMapsTested!: MappoolMap[];

    @OneToMany(() => MappoolMapSkill, skill => skill.user)
        mappoolMapSkillRatings!: MappoolMapSkill[];

    @OneToMany(() => MappoolMapWeight, weight => weight.user)
        mappoolMapSkillWeights!: MappoolMapWeight[];

    @OneToMany(() => TournamentChannel, channel => channel.createdBy)
        tournamentChannelsCreated!: TournamentChannel[];

    @OneToMany(() => TournamentRole, role => role.createdBy)
        tournamentRolesCreated!: TournamentRole[];

    @OneToMany(() => Stage, stage => stage.createdBy)
        stagesCreated!: Stage[];

    @OneToMany(() => Mappool, mappool => mappool.createdBy)
        mappoolsCreated!: Mappool[];

    @OneToMany(() => MappoolSlot, mappoolSlot => mappoolSlot.createdBy)
        mappoolSlotsCreated!: MappoolSlot[];

    @OneToMany(() => MappoolMap, mappoolMap => mappoolMap.createdBy)
        mappoolMapsCreated!: MappoolMap[];

    @OneToMany(() => MappoolMap, mappoolMap => mappoolMap.assignedBy)
        mappoolMapsAssigned!: MappoolMap[];

    @OneToMany(() => MappoolMapHistory, history => history.createdBy)
        mappoolMapHistoryEntriesCreated!: MappoolMapHistory[];

    @OneToMany(() => JobPost, post => post.createdBy)
        jobPostsCreated!: JobPost[];

    @OneToMany(() => Team, team => team.manager)
        teamsManaged!: Team[];

    @OneToMany(() => TeamInvite, invite => invite.user)
        teamInvites!: TeamInvite[];

    @ManyToMany(() => Team, team => team.members)
        teams!: Team[];

    static basicSearch (query: MapperQuery) {
        const queryBuilder = User
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.otherNames", "otherName")
            .leftJoinAndSelect("user.mcaEligibility", "mca")
            .where(`mca.year = :q`, { q: parseInt(query.year) });

        // Check mode
        if (query.mode && query.mode in ModeDivisionType) {
            queryBuilder.andWhere(`mca.${query.mode} = true`);
        }
        
        // Remove users with comments already
        if (query.notCommented === "true") {
            queryBuilder.andWhere((qb) => {
                const subQuery = qb.subQuery()
                    .from(UserComment, "userComment")
                    .where("userComment.targetID = user.ID")
                    .getQuery();

                return "NOT EXISTS " + subQuery;
            });
        }

        // osu! friends list
        if (query.friends && query.friends?.length > 0)
            queryBuilder.andWhere("user.osuUserid IN (" + query.friends.join(",") + ")");

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
        const order = query.order || "ASC";
        let orderMethod = "CAST(user_osuUserid AS UNSIGNED)";
        if (query.option && query.option.toLowerCase().includes("alph"))
            orderMethod = "user_osuUsername";
            
        // Search
        return queryBuilder
            .skip(parseInt(query.skip || "") || 0)
            .take(50)
            .orderBy(orderMethod, order)
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
            .where(`mca.${modeString} = 1`);

        // Only include if there are more than 2 nominators in voting stage
        if (stage === "voting" && modeString === "standard") {
            queryBuilder
                .andWhere((qb) => {
                    const subQuery = qb.subQuery()
                        .select("count(nominator.ID)")
                        .from(Nomination, "nomination")
                        .innerJoin("nomination.nominators", "nominator")
                        .leftJoin("nomination.category", "category")
                        .where("nomination.user = user.ID")
                        .andWhere("category.ID = :categoryId", { categoryId: category.ID })
                        .getQuery();

                    return `${subQuery} >= 2`;
                });
        }
        
        if (category.filter?.rookie) {
            queryBuilder
                .andWhere((qb) => {
                    const subQuery = qb.subQuery()
                        .from(Beatmapset, "beatmapset")
                        .innerJoin("beatmapset.beatmaps", "beatmap")
                        .select("min(year(approvedDate))")
                        .andWhere("creatorID = user.ID")
                        .andWhere(`beatmap.modeID = ${ModeDivisionType[modeString]}`)
                        .andWhere(`beatmap.difficulty NOT LIKE '%\\'s%'`)
                        .andWhere(`beatmap.difficulty NOT LIKE '%s\\'%'`) // These 2 lines are to check for posessives in diff names which would indicate a guest diff
                        .getQuery();

                    return subQuery + " = " + year;
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
        const order = query.order || "ASC";
        let orderMethod = "user_osuUsername";
        if (query.option && query.option.toLowerCase().includes("id"))
            orderMethod = "CAST(user_osuUserid AS UNSIGNED)";
            
        // Search
        return Promise.all([
            queryBuilder
                .skip(query.skip)
                .take(50)
                .orderBy(orderMethod, order)
                .getMany(),

            queryBuilder.getCount(),
        ]);
    }

    static filterBWSBadges (badges) {
        return badges.filter(badge => !bwsFilter.test(badge.description));
    }

    private async refreshOsuToken (this: User) {
        const data = await osuV2Client.refreshToken(this);
        this.osu.accessToken = data.access_token;
        this.osu.refreshToken = data.refresh_token;
        this.osu.lastVerified = new Date();
        await this.save();

        return data;
    }

    public async getAccessToken (tokenType: "osu" | "discord" = "osu"): Promise<string> {
        // Check if lastVerified + 86100000 ms is less than current time (24 hours - 5 minute buffer)
        if (tokenType === "osu" && this.osu.lastVerified.getTime() + 86100000 < Date.now()) {
            // Refresh token
            const data = await this.refreshOsuToken();
            return data.access_token;
        }

        if (this[tokenType].accessToken)
            return this[tokenType].accessToken!;

        const res = await User
            .createQueryBuilder("user")
            .select(tokenType === "osu" ? "osuAccesstoken" : "discordAccesstoken")
            .where(`ID = ${this.ID}`)
            .getRawOne();
        return res[tokenType === "osu" ? "osuAccesstoken" : "discordAccesstoken"];
    }

    public async getBWS () {
        const accessToken = this.osu.accessToken || await this.getAccessToken("osu");
        const userData = await osuV2Client.getUserInfo(accessToken);
        if (!userData.badges)
            return 0;

        return Math.pow(userData.statistics.global_rank, Math.pow(0.9937, Math.pow((await User.filterBWSBadges(userData.badges)).length, 2)));
    }

    public getCondensedInfo (chosen = false): UserChoiceInfo {
        return {
            corsaceID: this.ID,
            avatar: this.osu.avatar,
            userID: this.osu.userID,
            username: this.osu.username,
            otherNames: this.otherNames.map(otherName => otherName.name),
            chosen,
        };
    }
    
    public async getInfo (member?: GuildMember | undefined): Promise<UserInfo> {
        if (this.discord?.userID && !member)
            member = await getMember(this.discord.userID);
        const info: UserInfo = {
            corsaceID: this.ID,
            discord: {
                avatar: "https://cdn.discordapp.com/avatars/" + this.discord.userID + "/" + this.discord.avatar + ".png",
                userID: this.discord.userID,
                username: member ? `${member.user.username}#${member.user.discriminator}` : this.discord.username,
            },
            osu: {
                avatar: this.osu.avatar,
                userID: this.osu.userID,
                username: this.osu.username,
                otherNames: this.otherNames.map(otherName => otherName.name),
            },
            staff: {
                corsace: member ? member.roles.cache.has(config.discord.roles.corsace.corsace) : false,
                headStaff: member ? config.discord.roles.corsace.headStaff.some(r => member!.roles.cache.has(r)) : false,
                staff: member ? member.roles.cache.has(config.discord.roles.corsace.staff) : false,
            },
            joinDate: this.registered,
            lastLogin: this.lastLogin,
            canComment: this.canComment,
        };
        return info;
    }

    public async getMCAInfo (): Promise<UserMCAInfo> {
        let member: GuildMember | undefined;
        if (this.discord?.userID)
            member = await getMember(this.discord.userID);
        const mcaInfo: UserMCAInfo = await this.getInfo(member) as UserMCAInfo;
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
