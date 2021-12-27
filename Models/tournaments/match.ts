import { BaseEntity, Column, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { MatchInfo } from "../../Interfaces/match";
import { Team } from "./team";
import { User } from "../user";
import { Bracket } from "./bracket";
import { Group } from "./group";
import { MatchBeatmap } from "./matchBeatmap";
import { MatchSet } from "./matchSet";

@Entity()
export class Match extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    matchID!: string;

    @Column({ type: "timestamp" })
    time!: Date;

    @ManyToOne(() => Bracket, bracket => bracket.matches)
    bracket?: Bracket;

    @ManyToOne(() => Group, group => group.matches)
    group?: Group;

    @ManyToOne(() => Team, team => team.matches)
    teamA?: Team;

    @ManyToOne(() => Team, team => team.matches)
    teamB?: Team;

    @Column({ default: 0 })
    teamAScore!: number;

    @Column({ default: 0 })
    teamBScore!: number;

    @ManyToOne(() => Team, team => team.matchesFirst)
    first?: Team;

    @ManyToOne(() => Team, team => team.matchesWon)
    winner?: Team;

    @OneToMany(() => MatchSet, set => set.match)
    sets?: MatchSet[];

    @OneToMany(() => MatchBeatmap, matchBeatmap => matchBeatmap.match)
    beatmaps?: MatchBeatmap[];

    @Column({ default: false })
    forfeit!: boolean;

    @Column({ default: false })
    potential!: boolean;

    @ManyToOne(() => User, user => user.matchesReffed)
    referee?: User;

    @ManyToMany(() => User, user => user.matchesCommentated)
    commentators?: User[];

    @ManyToOne(() => User, user => user.matchesStreamed)
    streamer?: User;

    @Column({ nullable: true })
    twitch?: string;

    @Column({ nullable: true })
    mp?: number;

    @Column({ type: "tinyint" })
    bestof!: 1 | 3 | 5 | 7 | 9 | 11 | 13 | 15;

    public getInfo = async function(this: Match): Promise<MatchInfo> {
        const info: MatchInfo = {
            ID: this.ID,
            matchID: this.matchID,
            time: this.time,
            bracket: this.bracket ? await this.bracket.getInfo() : undefined,
            group: this.group ? await this.group.getInfo() : undefined,
            teamA: this.teamA ? await this.teamA.getInfo() : undefined,
            teamB: this.teamB ? await this.teamB.getInfo() : undefined,
            teamAScore: this.teamAScore,
            teamBScore: this.teamBScore,
            first: this.first ? await this.first.getInfo() : undefined,
            winner: this.winner ? await this.winner.getInfo() : undefined,
            sets: this.sets ? await Promise.all(this.sets.map((set) => set.getInfo())) : undefined,
            beatmaps: this.beatmaps ? await Promise.all(this.beatmaps.map((map) => map.getInfo())) : undefined,
            forfeit: this.forfeit,
            potential: this.potential,
            referee: this.referee ? await this.referee.getInfo() : undefined,
            commentators: this.commentators ? await Promise.all(this.commentators.map((commentator) => commentator.getInfo())) : undefined,
            streamer: this.streamer ? await this.streamer.getInfo() : undefined,
            twitch: this.twitch,
            mp: this.mp,
        };
        return info;
    };
}