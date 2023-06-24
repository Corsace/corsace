import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user";
import { MatchupMap } from "./matchupMap";

@Entity()
export class MatchupScore extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @ManyToOne(() => User, user => user.matchupScores)
        user!: User;

    @OneToMany(() => MatchupMap, map => map.scores)
        map!: MatchupMap;

    @Column("int")
        score!: number;

    @Column()
        mods!: number;

    @Column()
        misses!: number;

    @Column()
        combo!: number;

    @Column()
        accuracy!: number;

    @Column()
        fullCombo!: boolean;

    @Column()
        fail!: boolean;

    constructor (user: User) {
        super();
        this.user = user;
    }
}