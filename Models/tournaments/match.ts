import { BaseEntity, Column, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user";
import { Bracket } from "./bracket";
import { Group } from "./group";
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

    @Column()
    bracketID?: number;
    
    @ManyToOne(() => Bracket, bracket => bracket.matches)
    bracket?: Bracket;

    @Column()
    groupID?: number;
    
    @ManyToOne(() => Group, group => group.matches)
    group?: Group;

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
    firstID?: number;

    @ManyToOne(() => TournamentTeam, tournamentTeam => tournamentTeam.matchesFirst)
    first?: TournamentTeam;
    
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