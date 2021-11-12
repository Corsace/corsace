import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Team } from "../team";
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

    @ManyToOne(() => Tournament, tournament => tournament.qualifiers)
    tournament!: Tournament;

    @ManyToOne(() => Mappool, mappool => mappool.qualifiers)
    mappool!: Mappool;

    @OneToMany(() => MatchPlay, score => score.qualifier)
    scores!: MatchPlay[];

    @Column({ nullable: true })
    mp?: number;

    @ManyToOne(() => User, user => user.qualifiersReffed)
    referee?: User;

    @Column()
    public!: boolean;

    @OneToMany(() => Team, team => team.qualifier, {
        nullable: true
    })
    teams!: Team[];
}