import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user";
import { MatchBeatmap } from "./matchBeatmap";
import { Qualifier } from "./qualifier";

@Entity()
export class MatchPlay extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    userID!: number;

    @ManyToOne(() => User, user => user.scores)
    user!: User;

    @Column()
    beatmapID!: number;

    @ManyToOne(() => MatchBeatmap, beatmap => beatmap.scores)
    beatmap!: MatchBeatmap;

    @Column()
    qualifierID?: number;

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

    @Column()
    FC!: boolean;

    @Column()
    fail!: boolean;
}