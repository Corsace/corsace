import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user";
import { Mappool } from "./mappool";
import { MatchPlay } from "./matchPlay";
import { Tournament } from "./tournament";

@Entity()
export class Qualifier extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column({ type: "timestamp" })
    time!: Date;

    @Column()
    tournamentID!: number;

    @ManyToOne(() => Tournament, tournament => tournament.qualifiers)
    tournament!: Tournament;

    @Column()
    mappoolID!: number;

    @OneToOne(() => Mappool, mappool => mappool.qualifier)
    @JoinColumn()
    mappool!: Mappool;

    @OneToMany(() => MatchPlay, score => score.qualifier)
    scores!: MatchPlay[];

    @Column({ nullable: true })
    mp?: number;

    @ManyToOne(() => User, user => user.qualifiersReffed)
    referee?: User;
}