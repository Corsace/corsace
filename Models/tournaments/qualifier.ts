import { BaseEntity, Check, Column, Entity, ManyToMany, ManyToOne, MoreThanOrEqual, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user";
import { Mappool } from "./mappool";
import { MatchPlay } from "./matchPlay";
import { Team } from "./team";
import { Tournament } from "./tournament";

@Entity()
export class Qualifier extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column({ type: "timestamp" })
    time!: Date;

    @ManyToOne(() => Tournament, tournament => tournament.qualifiers)
    tournament!: Tournament;

    @ManyToOne(() => Mappool, mappool => mappool.qualifiers)
    mappool!: Mappool;

    @OneToMany(() => MatchPlay, score => score.qualifier)
    scores!: MatchPlay[];

    @Column({ nullable: true })
    mp?: number;

    @ManyToOne(() => User, user => user.qualifiersRefereed)
    referee!: User;

    @OneToMany(() => Team, team => team.qualifier)
    teams!: Team[];

    @ManyToMany(() => User, user => user.qualifiers)
    players!: User[];

}
