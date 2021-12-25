import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MatchPlayInfo } from "../../Interfaces/match";
import { User } from "../user";
import { MatchBeatmap } from "./matchBeatmap";
import { Qualifier } from "./qualifier";

@Entity()
export class MatchPlay extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @ManyToOne(() => User, user => user.scores)
    user!: User;

    @ManyToOne(() => MatchBeatmap, beatmap => beatmap.scores)
    beatmap!: MatchBeatmap;

    @ManyToOne(() => Qualifier, qualifier => qualifier.scores)
    qualifier!: Qualifier;

    @Column()
    score!: number;

    @Column()
    mods!: string;

    @Column()
    misses!: number;

    @Column()
    combo!: number;

    @Column({ type: "float" })
    accuracy!: number;

    @Column({ default: false })
    FC!: boolean;

    @Column({ default: false })
    fail!: boolean;

    public getInfo = async function(this: MatchPlay): Promise<MatchPlayInfo> {
        const info: MatchPlayInfo = {
            ID: this.ID,
            user: await this.user.getInfo(),
            score: this.score,
            mods: this.mods,
            misses: this.misses,
            combo: this.combo,
            accuracy: this.accuracy,
            FC: this.FC,
            fail: this.fail,
        };
        return info;
    }
    
}