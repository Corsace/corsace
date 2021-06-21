import { BaseEntity, Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Bracket } from "./bracket";
import { MatchSet } from "./matchSet";
import { TournamentTeam } from "./tournamentTeam";

@Entity()
export class Match extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    matchID!: string;

    @ManyToOne(() => Bracket, bracket => bracket.matches)
    bracket!: Bracket;

    @ManyToMany(() => TournamentTeam, tournamentTeam => tournamentTeam.matches)
    @JoinTable()
    teams!: TournamentTeam[];

    @Column()
    winnerID!: number;

    @ManyToOne(() => TournamentTeam, tournamentTeam => tournamentTeam.matchesWon)
    winner!: TournamentTeam;

    @OneToMany(() => MatchSet, set => set.match)
    sets!: MatchSet[];
    
    // TODO: FINISH THIS
}