import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user";
import { MatchMap } from "./matchMap";

@Entity()
export class MatchScore extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @ManyToOne(() => User, user => user.matchScores)
        user!: User;

    @OneToMany(() => MatchMap, map => map.scores)
        map!: MatchMap;

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
}