import { BaseEntity, Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user";
import { Bracket } from "./bracket";
import { MatchBeatmap } from "./matchBeatmap";
import { MatchSet } from "./matchSet";
import { TournamentTeam } from "./tournamentTeam";

@Entity()
export class Match extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    matchID!: string;

    @Column({ type: "timestamp" })
    time!: Date;

    @ManyToOne(() => Bracket, bracket => bracket.matches)
    bracket!: Bracket;

    @Column()
    teamAID?: number;
    
    @ManyToOne(() => TournamentTeam, tournamentTeam => tournamentTeam.matches)
    teamA?: TournamentTeam;

    @Column()
    teamBID?: number;
    
    @ManyToOne(() => TournamentTeam, tournamentTeam => tournamentTeam.matches)
    teamB?: TournamentTeam;

    @Column({ default: 0 })
    teamAScore!: number;

    @Column({ default: 0 })
    teamBScore!: number;

    @Column()
    winnerID?: number;

    @ManyToOne(() => TournamentTeam, tournamentTeam => tournamentTeam.matchesWon)
    winner?: TournamentTeam;

    @OneToMany(() => MatchSet, set => set.match)
    sets?: MatchSet[];
    
    @OneToMany(() => MatchBeatmap, matchBeatmap => matchBeatmap.match)
    beatmaps?: MatchBeatmap[];
    
    @Column({ default: false })
    forfeit!: boolean;

    @Column({ default: false })
    potential!: boolean;

    @Column()
    refereeID?: number;
    
    @ManyToOne(() => User, user => user.matchesReffed)
    referee?: User;

    @ManyToMany(() => User, user => user.matchesCommentated)
    commentators?: User[];

    @Column()
    streamerID?: number;
    
    @ManyToOne(() => User, user => user.matchesStreamed)
    streamer?: User;

    @Column({ nullable: true })
    twitch?: string;

    @Column({ nullable: true })
    mp?: number;

}