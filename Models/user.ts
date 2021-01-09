
import { Entity, Column, BaseEntity, PrimaryGeneratedColumn, CreateDateColumn, OneToMany, OneToOne, JoinColumn, JoinTable, ManyToOne, ManyToMany } from "typeorm";
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
import { discordGuild } from "../CorsaceServer/discord";

// General middlewares
const config = new Config();

export class OAuth {

    @Column({ default: null })
    userID!: string;

    @Column({ default: "" })
    username!: string;
    
    @Column({ default: "" })
    avatar!: string;

    @Column({ type: "longtext", default: "" })
    accessToken!: string;

    @Column({ type: "longtext", default: "" })
    refreshToken!: string;

    @CreateDateColumn()
    dateAdded!: Date;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    lastVerified!: Date;

}

@Entity()
export class User extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column(type => OAuth)
    discord!: OAuth;
    
    @Column(type => OAuth)
    osu!: OAuth;

    @CreateDateColumn()
    registered!: Date;
    
    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    lastLogin!: Date;

    @OneToMany(type => UsernameChange, change => change.user, {
        eager: true,
    })
    otherNames!: UsernameChange[];

    @OneToMany(type => DemeritReport, demerit => demerit.user, {
        eager: true,
    })
    demerits!: DemeritReport[];

    @OneToOne(type => GuestRequest, guestRequest => guestRequest.user, {
        eager: true,
    })
    @JoinColumn()
    guestRequest!: GuestRequest;

    @OneToMany(type => MCAEligibility, eligibility => eligibility.user, {
        eager: true,
    })
    @JoinTable()
    mcaEligibility!: MCAEligibility[];

    @OneToMany(type => Beatmapset, set => set.creator)
    beatmapsets!: Beatmapset[];

    @OneToMany(type => UserComment, userComment => userComment.commenter)
    commentsMade!: UserComment[];

    @OneToMany(type => UserComment, userComment => userComment.target)
    commentsReceived!: UserComment[];

    @OneToMany(type => UserComment, userComment => userComment.reviewer)
    commentReviews!: UserComment[];

    @OneToMany(type => Nomination, userComment => userComment.reviewer)
    nominationReviews!: Nomination[];

    @Column({ default: true })
    canComment!: boolean;
    
    @OneToMany(type => Nomination, nomination => nomination.nominator)
    nominations!: Nomination[];
    
    @OneToMany(type => Nomination, nomination => nomination.user)
    nominationsReceived!: Nomination[];

    @OneToMany(type => Vote, vote => vote.voter)
    votes!: Vote[];
    
    @OneToMany(type => Vote, vote => vote.user)
    votesReceived!: Vote[];

    public getCondensedInfo = function(this: User, chosen = false): UserCondensedInfo {
        return {
            corsaceID: this.ID,
            avatar: this.osu.avatar + "?" + Math.round(Math.random()*1000000),
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
                avatar: this.osu.avatar + "?" + Math.round(Math.random()*1000000),
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

export interface UserMCAInfo extends UserInfo {
    guestReq: GuestRequest;
    eligibility: MCAEligibility[];
    mcaStaff: {
        standard: boolean;
        taiko: boolean;
        fruits: boolean;
        mania: boolean;
        storyboard: boolean;
    }
}

export interface UserInfo {
    corsaceID: number;
    discord: {
        avatar: string;
        userID: string;
        username: string;
    };
    osu: {
        avatar: string;
        userID: string;
        username: string;
        otherNames: string[];
    };
    staff: {
        corsace: boolean;
        headStaff: boolean;
        staff: boolean;
    };
    joinDate: Date;
    lastLogin: Date;
}

export interface UserCondensedInfo {
    corsaceID: number;
    username: string;
    avatar: string;
    userID: string;
    otherNames: string[];
    chosen: boolean;
}