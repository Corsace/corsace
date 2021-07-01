import { BaseEntity, Column, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Team } from "../team";
import { Match } from "./match";
import { MatchBeatmap } from "./matchBeatmap";
import { MatchSet } from "./matchSet";
import { Tournament } from "./tournament";

@Entity()
export class TournamentTeam extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column({ default: false })
    disqualified!: boolean;

    @ManyToOne(() => Tournament, tournament => tournament.tournamentTeams)
    tournament!: Tournament;

    @ManyToOne(() => Team, team => team.tournamentTeams, {
        eager: true,
    })
    team!: Team;

    @ManyToMany(() => Match, match => match.teamA || match.teamB)
    matches?: Match[];

    @OneToMany(() => MatchBeatmap, map => map.winner)
    mapsWon?: MatchBeatmap[]
    
    @OneToMany(() => MatchSet, set => set.winner)
    setsWon?: MatchSet[]
    
    @OneToMany(() => Match, match => match.winner)
    matchesWon?: Match[]
    
    @OneToMany(() => Match, match => match.first)
    matchesFirst?: Match[]
}