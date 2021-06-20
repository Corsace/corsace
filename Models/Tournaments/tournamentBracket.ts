import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Mappool } from "./mappool";
import { Tournament } from "./tournament";

@Entity()
export class TournamentBracket extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @ManyToOne(() => Tournament, tournament => tournament.brackets)
    tournament!: Tournament

    @Column({ type: "timestamp" })
    weekend!: Date;

    @OneToOne(() => Mappool)
    @JoinColumn()
    mappool!: Mappool;
}