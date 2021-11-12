import { Entity, BaseEntity, PrimaryColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Team } from "../team";
import { User } from "../user";

@Entity()
export class Score extends BaseEntity {
    @PrimaryGeneratedcolumn()
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