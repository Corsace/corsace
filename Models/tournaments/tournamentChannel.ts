import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Tournament } from "./tournament";
import { User } from "../user";
import { TournamentRoleType } from "./tournamentRole";
import { GuildForumTagData } from "discord.js";

export enum TournamentChannelType {
    General,
    Participants,
    Managers,
    Announcements,
    Admin,
    Mappool,
    Mappoollog,
    Mappoolqa,
    Testplayers,
    Referee,
    Stream,
    Matchupresults,
    Jobboard,
    Staff,
    Streamannouncements,
}

// Designate an array of TournamentRoles for each channel type
// Having this as a function instead of a constant avoids possible circular dependencies and undefined errors on instance startup
export function getTournamentChannelTypeRoles () {
    return {
        [TournamentChannelType.General]: undefined,
        [TournamentChannelType.Participants]: Object.values(TournamentRoleType).filter((role) => typeof role === "number") as TournamentRoleType[],
        [TournamentChannelType.Managers]: Object.values(TournamentRoleType).filter((role) => typeof role === "number").filter(role => role !== 1) as TournamentRoleType[],
        [TournamentChannelType.Announcements]: undefined,
        [TournamentChannelType.Admin]: [TournamentRoleType.Organizer],
        [TournamentChannelType.Mappool]: [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers],
        [TournamentChannelType.Mappoollog]: [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers, TournamentRoleType.Mappers, TournamentRoleType.Testplayers],
        [TournamentChannelType.Mappoolqa]: [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers, TournamentRoleType.Mappers, TournamentRoleType.Testplayers],
        [TournamentChannelType.Testplayers]: [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers, TournamentRoleType.Mappers, TournamentRoleType.Testplayers],
        [TournamentChannelType.Referee]: [TournamentRoleType.Organizer, TournamentRoleType.Referees],
        [TournamentChannelType.Stream]: [TournamentRoleType.Organizer, TournamentRoleType.Referees, TournamentRoleType.Streamers, TournamentRoleType.Commentators],
        [TournamentChannelType.Matchupresults]: undefined,
        [TournamentChannelType.Jobboard]: [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers, TournamentRoleType.Mappers],
        [TournamentChannelType.Staff]: [TournamentRoleType.Staff],
        [TournamentChannelType.Streamannouncements]: undefined,
    } as { [key in TournamentChannelType]: TournamentRoleType[] | undefined };
}

// Having this as a function instead of a constant avoids possible circular dependencies and undefined errors on instance startup
export function forumTags () {
    return {
        [TournamentChannelType.Mappoolqa]: [
            { name: "WIP", moderated: true },
            { name: "Finished", moderated: true },
            { name: "Late", moderated: true },
            { name: "Needs HS", moderated: true },
        ],
        [TournamentChannelType.Jobboard]: [
            { name: "Open", moderated: true },
            { name: "Closed", moderated: true },
            { name: "To Assign", moderated: true },
        ],
    } as { [key in TournamentChannelType]?: GuildForumTagData[] };
}

@Entity()
export class TournamentChannel extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @CreateDateColumn()
        createdAt!: Date;

    @ManyToOne(() => User, user => user.tournamentChannelsCreated)
        createdBy!: User;

    @Column()
        channelID!: string;

    @ManyToOne(() => Tournament, tournament => tournament.channels)
        tournament!: Tournament;

    @Column({ type: "enum", enum: TournamentChannelType, default: TournamentChannelType.General })
        channelType!: TournamentChannelType;
}