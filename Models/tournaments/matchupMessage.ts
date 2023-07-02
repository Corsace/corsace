import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../user";
import { Matchup } from "./matchup";

@Entity()
export class MatchupMessage extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @Column("datetime")
        timestamp!: Date;

    @ManyToOne(() => User, user => user.matchupMessages)
        user!: User;

    @ManyToOne(() => Matchup, matchup => matchup.messages)
        matchup!: Matchup;

    @Column("text")
        content!: string;

}