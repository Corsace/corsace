import { BaseEntity, Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Beatmap } from "../beatmap";
import { Mappool } from "./mappool";

@Entity()
export class MappoolBeatmap extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    mod!: string;

    @Column()
    slot!: number;

    @ManyToOne(() => Mappool, mappool => mappool.beatmaps)
    mappool!: Mappool;

    @ManyToOne(() => Beatmap, beatmap => beatmap.mappoolBeatmaps)
    beatmap!: Beatmap;

}