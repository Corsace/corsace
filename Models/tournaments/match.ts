import { BaseEntity, Column, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Team } from "./team";
import { User } from "../user";
import { Bracket } from "./bracket";
import { Group } from "./group";
import { MatchBeatmap } from "./matchBeatmap";
import { MatchSet } from "./matchSet";
import { Tournament } from "./tournament";
import { smallRoundsAcronyms } from "../../Interfaces/bracket";

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
    
    @ManyToOne(() => Tournament, tournament => tournament.matches)
    tournament?: Tournament;

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
    bestofSet!: 1 | 3 | 5 | 7 | 9 | 11 | 13 | 15 | 17 | 19;

    @Column({ type: "tinyint", default: 1 })
    bestofMatch!: 1 | 3 | 5 | 7 | 9 | 11 | 13 | 15 | 17 | 19;

}

export class MatchGenerator {
    /**
     * Generates matches for a given tournament and bracket
     */
    public async generateMatches(tournament: Tournament, bracket: Bracket, bracketSize: number, matchNum: number, setNum?: number) {
        for (let i = 1; i <= matchNum; i++) {
            const match = new Match();
            match.tournament = tournament;
            match.bracket = bracket;
            match.matchID = `${tournament.slug}-${bracketSize > 8 ? `RO${bracketSize}` : smallRoundsAcronyms[bracketSize]}-${i}`;
            match.time = new Date();
            match.beatmaps = [];
            match.forfeit = false;
            match.potential = false;
            match.bestofMatch = matchNum as 1 | 3 | 5 | 7 | 9 | 11 | 13 | 15 | 17 | 19;
            if (setNum) 
                match.bestofSet = setNum as 1 | 3 | 5 | 7 | 9 | 11 | 13 | 15 | 17 | 19;
            await match.save();
        }
    }
}