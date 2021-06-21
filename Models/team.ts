import { BaseEntity, Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Tournament } from "./tournaments/tournament";
import { TournamentTeam } from "./tournaments/tournamentTeam";
import { User } from "./user";

@Entity()
export class Team extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    name!: string;

    @ManyToMany(() => Tournament, tournament => tournament.teams)
    @JoinTable()
    tournaments!: Tournament[];

    @OneToMany(() => TournamentTeam, tournamentTeam => tournamentTeam.team)
    tournamentTeams!: TournamentTeam[];

    @OneToOne(() => User, user => user.teamHost)
    captain!: User;

    @OneToMany(() => User, user => user.team)
    players!: User[];
}