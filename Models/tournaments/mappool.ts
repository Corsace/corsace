import { BaseEntity, Entity, OneToMany, ManyToOne, OneToOne, PrimaryGeneratedColumn, Column } from "typeorm";
import { Tournament } from "./tournament";
import { Bracket } from "./bracket";
import { MappoolBeatmap } from "./mappoolBeatmap";
import { Group } from "./group";
import { Qualifier } from "./qualifier";
import { MappoolInfo } from "../../Interfaces/mappool";

@Entity()
export class Mappool extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    name!: string;

    @ManyToOne(() => Tournament, tournament => tournament.mappools)
    tournament!: Tournament;

    @OneToMany(() => MappoolBeatmap, beatmap => beatmap.mappool)
    beatmaps?: MappoolBeatmap[];

    @OneToOne(() => Bracket, bracket => bracket.mappool)
    bracket?: Bracket;

    @OneToMany(() => Group, group => group.mappool)
    groups?: Group[];

    @OneToMany(() => Qualifier, qualifier => qualifier.mappool)
    qualifiers?: Qualifier[];

    public getInfo = async function(this: Mappool): Promise<MappoolInfo> {
        const info: MappoolInfo = {
            ID: this.ID,
            name: this.name,
            tournament: await this.tournament.getInfo(),
            beatmaps: this.beatmaps ? await Promise.all(this.beatmaps.map((beatmap) => beatmap.getInfo())) : undefined,
            bracket: this.bracket ? await this.bracket.getInfo() : undefined,
            groups: this.groups ? await Promise.all(this.groups.map((group) => group.getInfo())) : undefined,
            qualifiers: this.qualifiers ? await Promise.all(this.qualifiers.map((qualifier) => qualifier.getInfo())) : undefined,
        };
        return info;
    }
}