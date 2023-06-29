import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user";
import { Matchup } from "./matchup";

@Entity()
export class MatchupMessage extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @CreateDateColumn()
        timestamp!: Date;

    @ManyToOne(() => User, user => user.matchupMessages)
        user!: User | null;

    @ManyToOne(() => Matchup, matchup => matchup.messages)
        matchup!: Matchup;

    @Column("text")
        content!: string;

}