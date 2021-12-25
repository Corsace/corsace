import { Entity, BaseEntity, PrimaryColumn, Column, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user";
import { Team } from "./team";

@Entity()
export class Score extends BaseEntity {
    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    qualifier?: number;

    @Column()
    user!: User;

    @Column()
    score!: number;

    @Column()
    mapID!: string;

    @Column()
    team!: Team;
}