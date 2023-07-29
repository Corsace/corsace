import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Tournament } from "./tournament";
import { User } from "../user";
import { TournamentChannelType } from "../../Interfaces/tournament";

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