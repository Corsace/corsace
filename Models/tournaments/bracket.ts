import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Mappool } from "./mappool";
import { Match } from "./match";
import { Tournament } from "./tournament";

@Entity()
export class Bracket extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    name!: string;

    @Column()
    size!: number;

    @Column()
    tournamentID!: number;

    @ManyToOne(() => Tournament, tournament => tournament.brackets)
    tournament!: Tournament

    @Column()
    mappoolID!: number;

    @OneToOne(() => Mappool, mappool => mappool.bracket)
    @JoinColumn()
    mappool!: Mappool;

    @OneToMany(() => Match, match => match.bracket)
    matches!: Match[];
}