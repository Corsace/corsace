import { BaseEntity, Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user";
import { MatchupMap } from "./matchupMap";
import { Round } from "./round";
import { Stage } from "./stage";
import { Team } from "./team";

@Entity()
export class Matchup extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @Column({ type: "int", nullable: true })
        mp?: number | null;

    @ManyToOne(() => Round, round => round.matches)
        round?: Round | null;

    @ManyToOne(() => Stage, stage => stage.matches)
        stage?: Stage | null;

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

    @ManyToOne(() => MatchupMap, map => map.matches)
        maps!: MatchupMap[];

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

    @ManyToMany(() => Matchup, match => match.nextMatches)
    @JoinTable()
        previousMatches?: Matchup[] | null;

    @ManyToMany(() => Matchup, match => match.previousMatches)
        nextMatches?: Matchup[] | null;

    @Column("mediumtext", { nullable: true })
        log?: string | null;
}