import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ModSlots } from "../../Interfaces/mappool";
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

    @Column()
    mappoolID!: number;

    @ManyToOne(() => Mappool, mappool => mappool.beatmaps)
    mappool!: Mappool;

    @Column()
    beatmapID!: number;
    
    @ManyToOne(() => Beatmap, beatmap => beatmap.mappoolBeatmaps, { eager: true })
    beatmap!: Beatmap;

    @OneToMany(() => MatchBeatmap, matchBeatmap => matchBeatmap.beatmap)
    matchBeatmaps?: MatchBeatmap[];
}