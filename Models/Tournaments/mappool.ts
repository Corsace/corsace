import { BaseEntity, Entity, JoinTable, OneToMany, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Tournament } from "./tournament";
import { Bracket } from "./bracket";
import { MappoolBeatmap } from "./mappoolBeatmap";

@Entity()
export class Mappool extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @ManyToOne(() => Tournament, tournament => tournament.mappools)
    tournament!: Tournament;

    @OneToMany(() => MappoolBeatmap, beatmap => beatmap.mappool)
    beatmaps!: MappoolBeatmap[];

    @OneToOne(() => Bracket, bracket => bracket.mappool)
    bracket!: Bracket;

}