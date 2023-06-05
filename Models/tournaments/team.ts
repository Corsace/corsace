import { BaseEntity, Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user";
import { Tournament } from "./tournament";

@Entity()
export class Team extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @CreateDateColumn()
        createdAt!: Date;

    @Column()
        name!: string;

    @Column()
        abbreviation!: string;

    @ManyToOne(() => User, user => user.teamsManaged)
        manager!: User;

    @ManyToMany(() => User, user => user.teams)
    @JoinTable()
        members!: User[];

    @ManyToMany(() => Tournament, tournament => tournament.teams)
        tournaments!: Tournament[];

    @Column()
        avatarURL!: string;

    @Column()
        BWS!: number;

    @Column()
        rank!: number;

}