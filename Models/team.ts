import { BaseEntity, Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { TeamInvitation } from "./teamInvitation";
import { Tournament } from "./tournaments/tournament";
import { TournamentTeam } from "./tournaments/tournamentTeam";
import { User } from "./user";

@Entity()
export class Team extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column("varchar", { length: 30 })
    name!: string;

    @ManyToMany(() => Tournament, tournament => tournament.teams)
    @JoinTable()
    tournaments!: Tournament[];

    @OneToMany(() => TournamentTeam, tournamentTeam => tournamentTeam.team)
    tournamentTeams!: TournamentTeam[];

    @Column()
    captainID!: number;

    @ManyToOne(() => User, user => user.teamHosts)
    captain!: User;

    @ManyToMany(() => User, user => user.teams)
    players?: User[];

    @OneToMany(() => TeamInvitation, invitation => invitation.team)
    invitations?: TeamInvitation[];

    @Column({ default: 0 })
    wins!: number;

    @Column({ default: 0 })
    losses!: number;
}