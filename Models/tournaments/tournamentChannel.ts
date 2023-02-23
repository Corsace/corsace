import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Tournament } from "./tournament";

export enum TournamentChannelType {
    General,
    Participants,
    Managers,
    Announcements,
    Admin,
    Mappool,
    MappoolLog,
    MappoolQA,
    Testplayers,
    Referee,
    Stream,
    MatchResults,
}

@Entity()
export class TournamentChannel extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    channelID!: string;

    @ManyToOne(() => Tournament, tournament => tournament.channels)
    tournament!: Tournament;

    @Column({ type: "enum", enum: TournamentChannelType, default: TournamentChannelType.General })
    channelType!: TournamentChannelType;

}