import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Team } from "../team";
import { Match } from "./match";
import { MatchBeatmap } from "./matchBeatmap";

@Entity()
export class MatchSet extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @ManyToOne(() => Match, match => match.sets)
    match!: Match;

    @ManyToOne(() => Team, team => team.setsWon)
    winner?: Team;

    @OneToMany(() => MatchBeatmap, matchBeatmap => matchBeatmap.set)
    beatmaps?: MatchBeatmap[];

    @Column({ default: 0 })
    teamAScore!: number;

    @Column({ default: 0 })
    teamBScore!: number;
}