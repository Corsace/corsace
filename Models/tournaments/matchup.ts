import { BaseEntity, Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user";
import { MatchupMessage } from "./matchupMessage";
import { MatchupSet } from "./matchupSet";
import { Round } from "./round";
import { Stage } from "./stage";
import { Team } from "./team";

export const preInviteTime = 10 * 60 * 1000; // Time to invite before matchup starts for players to come in

export type MatchupWithRelationIDs = Omit<Matchup, "winner" | "round" | "stage" | "team1" | "team2" | "teams" | "commentators" | "sets"> & { winner: number | null; round: number | null; stage: number | null; team1: number | null; team2: number | null; teams: number[]; commentators: number[]; sets: number[] }

@Entity()
export class Matchup extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @Column({ type: "varchar", default: "" })
        matchID!: string;

    @Column({ type: "int", nullable: true })
        mp?: number | null;

    @ManyToOne(() => Round, round => round.matchups)
        round?: Round | null;

    @ManyToOne(() => Stage, stage => stage.matchups)
        stage?: Stage | null;

    @Column({ type: "boolean", default: false })
        isLowerBracket!: boolean;

    @ManyToMany(() => Team, team => team.matchupGroup)
    @JoinTable()
        teams?: Team[];

    @ManyToOne(() => Team, team => team.matchupsAsTeam1)
        team1?: Team | null;

    @ManyToOne(() => Team, team => team.matchupsAsTeam2)
        team2?: Team | null;

    @Column({ type: "int", default: 0 })
        team1Score!: number;

    @Column({ type: "int", default: 0 })
        team2Score!: number;

    @ManyToOne(() => Team, team => team.wins)
        winner?: Team | null;

    @OneToMany(() => MatchupSet, set => set.matchup)
        sets?: MatchupSet[];

    @ManyToOne(() => Matchup, matchup => matchup.potentials)
        potentialFor?: Matchup | null;

    @OneToMany(() => Matchup, matchup => matchup.potentialFor)
        potentials?: Matchup[];

    @Column({ type: "boolean", default: false })
        invalid!: boolean;

    @Column({ type: "boolean", default: false })
        forfeit!: boolean;

    @Column({ type: "varchar", nullable: true })
        vod?: string | null;

    @Column("datetime")
        date!: Date;

    @ManyToOne(() => User, user => user.matchupsRefereed)
        referee?: User | null;

    @ManyToMany(() => User, user => user.matchupsCommentated)
    @JoinTable()
        commentators?: User[];

    @ManyToOne(() => User, user => user.matchupsStreamed)
        streamer?: User | null;

    @ManyToOne(() => Matchup, matchup => matchup.loserPreviousMatchups)
        loserNextMatchup?: Matchup | null;

    @OneToMany(() => Matchup, matchup => matchup.loserNextMatchup)
        loserPreviousMatchups?: Matchup[];

    @ManyToOne(() => Matchup, matchup => matchup.winnerPreviousMatchups)
        winnerNextMatchup?: Matchup | null;

    @OneToMany(() => Matchup, matchup => matchup.winnerNextMatchup)
        winnerPreviousMatchups?: Matchup[];

    @OneToMany(() => MatchupMessage, message => message.matchup, { persistence: false })
        messages?: MatchupMessage[];

    @Column({ type: "varchar", length: `http://255.255.255.255:65565`.length, nullable: true })
        baseURL?: string | null;

    assignStaff (role: "referee" | "streamer" | "commentators", user: User): void {
        if (this[role] === undefined)
            throw new Error(`Uninitialized relation: ${role}`);

        if (role === "referee" || role === "streamer")
            this[role] = user;
        else if (role === "commentators") {
            if (!this.commentators!.some(u => u.ID === user.ID))
                this.commentators!.push(user);
        } else
            throw new Error(`Invalid type: ${role}`);
    }

    unassignStaff (role: "referee" | "streamer" | "commentators", user: User): void {
        if (this[role] === undefined)
            throw new Error(`Uninitialized relation: ${role}`);

        if (role === "referee" || role === "streamer") {
            if (this[role] !== null && this[role]!.ID !== user.ID)
                throw new Error(`User is not currently assigned as ${role}`);
            this[role] = null;
        } else if (role === "commentators") {
            const index = this.commentators!.findIndex((u) => u.ID === user.ID);
            if (index === -1)
                throw new Error(`User is not currently assigned as ${role}`);
            this.commentators!.splice(index, 1);
        } else
            throw new Error(`Invalid type: ${role}`);
    }
}
