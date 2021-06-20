import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Tournament } from "./tournament";

@Entity()
export class TournamentBracket extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @ManyToOne(() => Tournament, tournament => tournament.brackets)
    tournament!: Tournament

    @Column({ type: "timestamp" })
    weekend!: Date;

    
}