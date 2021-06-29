import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { PickStatus } from "../../Interfaces/match";
import { MappoolBeatmap } from "./mappoolBeatmap";
import { Match } from "./match";
import { MatchSet } from "./matchSet";


@Entity()
export class MatchBeatmap extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column({ type: "enum", enum: PickStatus, default: PickStatus.picked })
    status!: PickStatus;

    @Column()
    beatmapID!: number;
    
    @ManyToOne(() => MappoolBeatmap, beatmap => beatmap.matchBeatmaps, { eager: true })
    beatmap!: MappoolBeatmap;

    @Column()
    matchID?: number;

    @ManyToOne(() => Match, match => match.beatmaps)
    match?: Match;

    @Column()
    setID?: number;

    @ManyToOne(() => MatchSet, matchSet => matchSet.beatmaps)
    set?: MatchSet;

    @OneToMany(() => MatchPlay, matchPlay => matchPlay.beatmap)
    scores?: MatchPlay[];

    @Column()
    winnerID?: number;

    @ManyToOne(() => TournamentTeam, tournamentTeam => tournamentTeam.setsWon)
    winner?: TournamentTeam;
}