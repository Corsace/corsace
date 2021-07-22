import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Phase } from "../phase";
import { Team } from "../team";
import { Mappool } from "./mappool";
import { Bracket } from "./bracket";
import { Group } from "./group";
import { Qualifier } from "./qualifier";

@Entity()
export class Tournament extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    name!: string;

    @Column(() => Phase)
    registration!: Phase;

    @Column()
    size!: number;

    @Column({ default: true })
    doubleElim!: boolean;

    @OneToMany(() => Bracket, bracket => bracket.tournament)
    brackets!: Bracket[];

    @OneToMany(() => Group, group => group.tournament)
    groups!: Group[];

    @OneToMany(() => Qualifier, qualifier => qualifier.tournament)
    qualifiers!: Qualifier[];

    @OneToMany(() => Mappool, mappool => mappool.tournament)
    mappools!: Mappool[];

    @OneToMany(() => Team, team => team.tournament)
    teams!: Team[];
}