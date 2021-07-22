import { BaseEntity, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Mappool } from "./mappool";
import { Match } from "./match";
import { Tournament } from "./tournament";

@Entity()
export class Group extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @ManyToOne(() => Tournament, tournament => tournament.groups)
    tournament!: Tournament;

    @ManyToOne(() => Mappool, mappool => mappool.groups)
    mappool!: Mappool;

    @OneToMany(() => Match, match => match.group)
    matches!: Match[];
}