import { BaseEntity, Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Phase } from "../phase";
import { Team } from "../team";
import { Mappool } from "./mappool";
import { Bracket } from "./bracket";
import { TournamentTeam } from "./tournamentTeam";

@Entity()
export class Tournament extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    name!: string;

    @Column(() => Phase)
    registration!: Phase;
    
    @OneToMany(() => Bracket, bracket => bracket.tournament)
    brackets!: Bracket[];

    @OneToMany(() => Mappool, mappool => mappool.tournament)
    mappools!: Mappool[];

    @ManyToMany(() => Team, team => team.tournaments)
    teams!: Team[];

    @OneToMany(() => Team, team => team.tournaments)
    tournamentTeams!: TournamentTeam[];
}