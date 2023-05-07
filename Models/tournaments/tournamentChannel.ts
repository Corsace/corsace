import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Tournament } from "./tournament";
import { User } from "../user";
import { TournamentRoleType } from "./tournamentRole";

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
    Matchresults,
}

// Designate an array of TournamentRoles for each channel type
export const TournamentChannelTypeRoles: { [key in TournamentChannelType]: TournamentRoleType[] | undefined } = {
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
    [TournamentChannelType.Matchresults]: undefined,
};

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