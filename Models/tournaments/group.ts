import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Mappool } from "./mappool";
import { Match } from "./match";
import { Tournament } from "./tournament";

@Entity()
export class Group extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    tournamentID!: number;

    @ManyToOne(() => Tournament, tournament => tournament.groups)
    tournament!: Tournament;

    @Column()
    mappoolID!: number;

    @OneToOne(() => Mappool, mappool => mappool.group)
    @JoinColumn()
    mappool!: Mappool;

    @OneToMany(() => Match, match => match.group)
    matches!: Match[];
}