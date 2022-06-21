import { BaseEntity, Check, Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, MoreThanOrEqual, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user";
import { Match } from "./match";
import { MatchBeatmap } from "./matchBeatmap";
import { MatchSet } from "./matchSet";
import { Qualifier } from "./qualifier";
import { TeamInvitation } from "./teamInvitation";
import { Tournament } from "./tournament";

@Entity()
export class Team extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @Column()
    name!: string;

    @Column()
    role!: string;

    @Column({ nullable: true, default: null })
    teamAvatarUrl!: string;

    @ManyToOne(() => User, user => user.teamsManaging)
    manager!: User;

    @Column({ default: false })
    managerIsPlaying!: boolean;
    
    @ManyToMany(() => User, user => user.teams)
    @JoinTable()
    members!: User[];

    @Column()
    averageBWS!: number;

    @Column({ type: "integer", nullable: true })
    rank?: number;

    @Column({ type: "char", nullable: true })
    seed?: "A" | "B" | "C" | "D";

    @ManyToMany(() => Tournament, tournament => tournament.teams)
    tournaments!: Tournament;

    @ManyToOne(() => Qualifier, qualifier => qualifier.teams)
    qualifier!: Qualifier;

    @ManyToMany(() => Match, match => match.teams)
    @JoinTable()
    matches!: Match[];

    @OneToMany(() => MatchBeatmap, matchBeatmap => matchBeatmap.winner)
    mapsWon!: MatchBeatmap[];

    @OneToMany(() => MatchSet, matchSet => matchSet.winner)
    setsWon!: MatchSet[];

    @OneToMany(() => Match, match => match.winner)
    matchesWon!: Match[];

    @OneToMany(() => Match, match => match.first)
    matchesFirst!: Match[];

    @OneToMany(() => TeamInvitation, invitation => invitation.team)
    invitations!: TeamInvitation[];

}