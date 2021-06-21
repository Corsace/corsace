import { BaseEntity, Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Bracket } from "./bracket";
import { Match } from "./match";
import { TournamentTeam } from "./tournamentTeam";

@Entity()
export class MatchSet extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    matchID!: number;

    @ManyToOne(() => Match, match => match.sets)
    match!: Match;

    @Column()
    winnerID!: number;

    @ManyToOne(() => TournamentTeam, tournamentTeam => tournamentTeam.matchesWon)
    winner!: TournamentTeam;

    // TODO: FINISH THIS
}