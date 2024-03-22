import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user";
import { MatchupMap } from "./matchupMap";

@Entity()
export class MatchupScore extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @ManyToOne(() => User, user => user.matchupScores, {
        nullable: false,
    })
        user!: User;

    @ManyToOne(() => MatchupMap, map => map.scores, {
        nullable: false,
    })
        map!: MatchupMap;

    @Column("int")
        score!: number;

    @Column()
        mods!: number;

    @Column()
        misses!: number;

    @Column()
        combo!: number;

    @Column("double")
        accuracy!: number;

    @Column()
        fullCombo!: boolean;

    @Column()
        fail!: boolean;

}