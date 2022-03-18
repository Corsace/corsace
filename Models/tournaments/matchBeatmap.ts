import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MatchBeatmapInfo, PickStatus } from "../../Interfaces/match";
import { Team } from "./team";
import { MappoolBeatmap } from "./mappoolBeatmap";
import { Match } from "./match";
import { MatchPlay } from "./matchPlay";
import { MatchSet } from "./matchSet";

@Entity()
export class MatchBeatmap extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column({ type: "enum", enum: PickStatus, default: PickStatus.picked })
    status!: PickStatus;

    @ManyToOne(() => MappoolBeatmap, beatmap => beatmap.matchBeatmaps, { 
        eager: true,
    })
    beatmap!: MappoolBeatmap;

    @ManyToOne(() => Match, match => match.beatmaps)
    match?: Match;

    @ManyToOne(() => MatchSet, matchSet => matchSet.beatmaps)
    set?: MatchSet;

    @OneToMany(() => MatchPlay, matchPlay => matchPlay.beatmap)
    scores?: MatchPlay[];

    @ManyToOne(() => Team, team => team.mapsWon)
    winner?: Team;

    public getInfo = async function(this: MatchBeatmap): Promise<MatchBeatmapInfo> {
        const info: MatchBeatmapInfo = {
            ID: this.ID,
            status: this.status,
            beatmap: await this.beatmap.getInfo(),
            match: this.match ? await this.match.getInfo() : undefined,
            set: this.set ? await this.set.getInfo() : undefined,
            scores: this.scores ? await Promise.all(this.scores.map((score) => score.getInfo())) : undefined,
            winner: this.status === PickStatus.picked && this.winner ? await this.winner.getInfo() : undefined,
        };
        return info;
    }
    
    
}