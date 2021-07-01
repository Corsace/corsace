import { BaseEntity, Entity, JoinTable, OneToMany, ManyToOne, OneToOne, PrimaryGeneratedColumn, Column } from "typeorm";
import { Tournament } from "./tournament";
import { Bracket } from "./bracket";
import { MappoolBeatmap } from "./mappoolBeatmap";
import { Group } from "./group";

@Entity()
export class Mappool extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    tournamentID!: number;

    @ManyToOne(() => Tournament, tournament => tournament.mappools)
    tournament!: Tournament;

    @OneToMany(() => MappoolBeatmap, beatmap => beatmap.mappool)
    beatmaps!: MappoolBeatmap[];

    @OneToOne(() => Bracket, bracket => bracket.mappool)
    bracket?: Bracket;

    @OneToOne(() => Group, group => group.mappool)
    group?: Group;

    @OneToOne(() => Group, group => group.mappool)
    qualifier?: Group;
}