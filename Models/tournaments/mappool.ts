import { BaseEntity, Entity, OneToMany, ManyToOne, OneToOne, PrimaryGeneratedColumn, Column } from "typeorm";
import { Tournament } from "./tournament";
import { Bracket } from "./bracket";
import { MappoolBeatmap } from "./mappoolBeatmap";
import { Group } from "./group";
import { Qualifier } from "./qualifier";

@Entity()
export class Mappool extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    name!: string;

    @ManyToOne(() => Tournament, tournament => tournament.mappools)
    tournament!: Tournament;

    @OneToMany(() => MappoolBeatmap, beatmap => beatmap.mappool)
    beatmaps!: MappoolBeatmap[];

    @OneToOne(() => Bracket, bracket => bracket.mappool)
    bracket?: Bracket;

    @OneToMany(() => Group, group => group.mappool)
    groups?: Group[];

    @OneToMany(() => Qualifier, qualifier => qualifier.mappool)
    qualifiers?: Qualifier[];
}