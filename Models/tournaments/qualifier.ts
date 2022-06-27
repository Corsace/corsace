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

export class QualifierGenerator {
    /**
     * Generates multiple qualifiers for a given tournament and its size
     */
    public async generateQualifiers(tournament: Tournament, qualStart: Date) {
        let qualTime = qualStart;
        const endTime = new Date(qualStart.getTime() + (2 * 24 * 60 * 60 * 1000));
        while (qualTime < endTime) {
            const qualifier = new Qualifier();
            qualifier.tournament = tournament;
            qualifier.time = qualTime;
            await qualifier.save();
            qualTime = new Date(qualTime.getTime() + (30 * 60 * 1000));
        }
    }
}