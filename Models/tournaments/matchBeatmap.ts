import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { PickStatus } from "../../Interfaces/match";
import { MappoolBeatmap } from "./mappoolBeatmap";
import { Match } from "./match";
import { MatchPlay } from "./matchPlay";
import { MatchSet } from "./matchSet";
import { TournamentTeam } from "./tournamentTeam";


@Entity()
export class MatchBeatmap extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column({ type: "enum", enum: PickStatus, default: PickStatus.picked })
    status!: PickStatus;
    
    @ManyToOne(() => MappoolBeatmap, beatmap => beatmap.matchBeatmaps, { 
        eager: true 
    })
    beatmap!: MappoolBeatmap;

    @ManyToOne(() => Match, match => match.beatmaps)
    match?: Match;

    @ManyToOne(() => MatchSet, matchSet => matchSet.beatmaps)
    set?: MatchSet;

    @OneToMany(() => MatchPlay, matchPlay => matchPlay.beatmap)
    scores?: MatchPlay[];

    @ManyToOne(() => TournamentTeam, tournamentTeam => tournamentTeam.mapsWon)
    winner?: TournamentTeam;
}