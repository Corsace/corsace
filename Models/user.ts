
import { Entity, Column, BaseEntity, PrimaryGeneratedColumn, CreateDateColumn, OneToMany, OneToOne, JoinColumn, JoinTable } from "typeorm";
import { DemeritReport } from "./demerits";
import { MCAEligibility } from "./MCA_AYIM/mcaEligibility";
import { GuestRequest } from "./MCA_AYIM/guestRequest";
import { UserComment } from "./MCA_AYIM/userComments";
import { UsernameChange } from "./usernameChange";
import { Nomination } from "./MCA_AYIM/nomination";
import { Vote } from "./MCA_AYIM/vote";
import { Beatmapset } from "./beatmapset";
import { Config } from "../config";
import { GuildMember } from "discord.js";
import { discordGuild } from "../Server/discord";
import { UserCondensedInfo, UserInfo, UserMCAInfo } from "../Interfaces/user";

// General middlewares
const config = new Config();

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

    @OneToOne(() => GuestRequest, guestRequest => guestRequest.user, {
        eager: true,
    })
    @JoinColumn()
    guestRequest!: GuestRequest;

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
        };
        return info;
    }

    public getMCAInfo = async function(this: User): Promise<UserMCAInfo> {
        let member: GuildMember | undefined;
        if (this.discord?.userID)
            member = await (await discordGuild()).members.fetch(this.discord.userID);
        const mcaInfo: UserMCAInfo = await this.getInfo() as UserMCAInfo;
        mcaInfo.guestReq = this.guestRequest,
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
