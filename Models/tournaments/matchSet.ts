import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Team } from "./team";
import { Match } from "./match";
import { MatchBeatmap } from "./matchBeatmap";
import { MatchSetInfo } from "../../Interfaces/match";

@Entity()
export class MatchSet extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @ManyToOne(() => Match, match => match.sets)
    match!: Match;

    @ManyToOne(() => Team, team => team.setsWon)
    winner?: Team;

    @OneToMany(() => MatchBeatmap, matchBeatmap => matchBeatmap.set)
    beatmaps?: MatchBeatmap[];

    @Column({ default: 0 })
    teamAScore!: number;

    @Column({ default: 0 })
    teamBScore!: number;

    public getInfo = async function(this: MatchSet): Promise<MatchSetInfo> {
        const infos = {
            ID: this.ID,
            match: await this.match.getInfo(),
            winner: this.winner ? await this.winner.getInfo() : undefined, // uhh
            beatmaps: this.beatmaps ? await Promise.all(this.beatmaps.map((map) => map.getInfo())) : undefined,
            teamAScore: this.teamAScore,
            teamBScore: this.teamBScore,
        };
        return infos;
    }
    
}