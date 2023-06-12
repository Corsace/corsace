import { BaseEntity, Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user";
import { MatchMap } from "./matchMap";
import { Round } from "./round";
import { Stage } from "./stage";
import { Team } from "./team";

@Entity()
export class Match extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @Column({ type: "int", nullable: true })
        mp?: number | null;

    @ManyToOne(() => Round, round => round.matches)
        round!: Round;

    @ManyToOne(() => Stage, stage => stage.matches)
        stage!: Stage;

    @ManyToOne(() => Team, team => team.matchesAsTeam1)
        team1!: Team;

    @ManyToOne(() => Team, team => team.matchesAsTeam2)
        team2!: Team;

    @Column({ type: "int", default: 0 })
        team1Score!: number;

    @Column({ type: "int", default: 0 })
        team2Score!: number;

    @ManyToOne(() => Team, team => team.wins)
        winner!: Team;

    @ManyToOne(() => MatchMap, map => map.matches)
        maps!: MatchMap[];

    @Column({ type: "boolean", default: false })
        potential!: boolean;

    @Column({ type: "boolean", default: false })
        forfeit!: boolean;

    @Column({ type: "varchar", nullable: true })
        vod?: string | null;

    @Column("datetime")
        date!: Date;

    @ManyToOne(() => User, user => user.matchesRefereed)
        referee!: User;

    @ManyToMany(() => User, user => user.matchesCommentated)
    @JoinTable()
        commentators!: User[];

    @ManyToOne(() => User, user => user.matchesStreamed)
        streamer!: User;

}