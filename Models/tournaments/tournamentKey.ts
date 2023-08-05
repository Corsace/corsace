import { BaseEntity, Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Tournament } from "./tournament";

@Entity()
export class TournamentKey extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @Column({ type: "varchar", length: 128, unique: true })
        key!: string;

    @OneToOne(() => Tournament, tournament => tournament.key)
        tournament!: Tournament;
}