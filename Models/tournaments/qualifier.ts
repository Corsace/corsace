import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Team } from "./team";
import { User } from "../user";
import { Mappool } from "./mappool";
import { MatchPlay } from "./matchPlay";
import { Tournament } from "./tournament";
import { QualifierInfo } from "../../Interfaces/qualifier";

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
    scores?: MatchPlay[];

    @Column({ nullable: true })
    mp?: number;

    @ManyToOne(() => User, user => user.qualifiersReffed)
    referee?: User;

    @Column({ default: false })
    public!: boolean;

    @OneToMany(() => Team, team => team.qualifier, {
        nullable: true,
    })
    teams?: Team[];

    public getInfo = async function(this: Qualifier): Promise<QualifierInfo> {
        const info: QualifierInfo = {
            ID: this.ID,
            teams: this.teams ? await Promise.all(this.teams.map((team) => team.getInfo())) : undefined,
            scores: this.scores ? await Promise.all(this.scores.map((score) => score.getInfo())) : undefined,
            time: this.time,
            mp: this.mp ? this.mp : undefined,
            referee: this.referee ? this.referee : undefined,
            public: this.public,
        };
        return info;
    };
    
}