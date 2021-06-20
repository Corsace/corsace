import { BaseEntity, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Beatmap } from "../beatmap";
import { Tournament } from "./tournament";

@Entity()
export class Mappool extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @ManyToOne(() => Tournament, tournament => tournament.mappools)
    tournament!: Tournament;

    @ManyToMany(() => Beatmap, beatmap => beatmap.mappools)
    @JoinTable()
    beatmaps!: Beatmap;

}