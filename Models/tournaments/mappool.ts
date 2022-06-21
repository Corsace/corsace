import { BaseEntity, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Bracket } from "./bracket";
import { Group } from "./group";
import { MappoolBeatmap } from "./mappoolBeatmap";
import { Qualifier } from "./qualifier";

@Entity()
export class Mappool extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @OneToMany(() => MappoolBeatmap, beatmap => beatmap.mappool)
    beatmaps!: MappoolBeatmap[];

    @OneToOne(() => Bracket, bracket => bracket.mappool)
    bracket?: Bracket;

    @OneToMany(() => Group, group => group.mappool)
    groups!: Group[];

    @OneToMany(() => Qualifier, qualifier => qualifier.mappool)
    qualifiers!: Qualifier[];

}