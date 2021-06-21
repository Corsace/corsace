import { BaseEntity, Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Bracket } from "./bracket";
import { TournamentTeam } from "./tournamentTeam";

@Entity()
export class Match extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    matchID!: string;

    @ManyToOne(() => Bracket, bracket => bracket.matches)
    bracket!: Bracket;

    @ManyToMany(() => TournamentTeam, tournamentTeam => tournamentTeam.matches)
    @JoinTable()
    teams!: TournamentTeam[];

    // TODO: THE REST OF THIS
}