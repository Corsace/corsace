import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MappoolBeatmapInfo, ModSlots } from "../../Interfaces/mappool";
import { Beatmap } from "../beatmap";
import { Mappool } from "./mappool";
import { MatchBeatmap } from "./matchBeatmap";

@Entity()
export class MappoolBeatmap extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column({ type: "enum", enum: ModSlots, default: ModSlots.NM })
    mod!: ModSlots;

    @Column()
    slot!: number;

    @ManyToOne(() => Mappool, mappool => mappool.beatmaps)
    mappool!: Mappool;

    @ManyToOne(() => Beatmap, beatmap => beatmap.mappoolBeatmaps, { eager: true })
    beatmap!: Beatmap;

    @OneToMany(() => MatchBeatmap, matchBeatmap => matchBeatmap.beatmap)
    matchBeatmaps?: MatchBeatmap[];

    public getInfo = async function(this: MappoolBeatmap): Promise<MappoolBeatmapInfo> {
        const infos: MappoolBeatmapInfo = {
            ID: this.ID,
            mod: this.mod,
            slot: this.slot,
            mappool: await this.mappool.getInfo(),
            beatmap: await this.beatmap.getInfo(),
            matchBeatmaps: this.matchBeatmaps ? await Promise.all(this.matchBeatmaps.map((matchBeatmap) => matchBeatmap.getInfo())) : undefined,
        };
        return infos;
    }

}