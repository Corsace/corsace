import { BaseEntity, Column, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
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

    @ManyToMany(() => Team, team => team.matches)
    teams?: Team[];

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

    @ManyToOne(() => User, user => user.matchesRefereed)
    referee?: User;

    @ManyToMany(() => User, user => user.matchesCommentated)
    commentators?: User[];

    @Column({ nullable: true })
    twitch?: string;

    @Column({ nullable: true })
    mp?: number;

    @Column({ type: "tinyint" })
    bestofSet!: 1 | 3 | 5 | 7 | 9 | 11 | 13 | 15;

    @Column({ type: "tinyint", default: 1 })
    bestofMatch!: 1 | 3 | 5 | 7 | 9 | 11 | 13 | 15;

}