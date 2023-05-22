import { BaseEntity, Check, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ModeDivision } from "../MCA_AYIM/modeDivision";
import { Phase } from "../phase";
import { User } from "../user";
import { Stage } from "./stage";
import { TournamentChannel } from "./tournamentChannel";
import { TournamentRole } from "./tournamentRole";

export enum SortOrder {
    Signup,
    Random,
    RankPP,
    BWS,
}

export enum TournamentStatus {
    NotStarted,
    Registrations,
    Ongoing,
    Finished,
}

export const unFinishedTournaments = [TournamentStatus.NotStarted, TournamentStatus.Registrations, TournamentStatus.Ongoing];

@Entity()
@Check(`"minTeamSize" <= "maxTeamSize"`)
@Check(`"matchSize" <= "minTeamSize"`)
export class Tournament extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @ManyToOne(() => User, user => user.tournamentsOrganized)
    organizer!: User;

    @ManyToOne(() => ModeDivision, mode => mode.tournaments, {
        nullable: false,
        eager: true,
    })
    mode!: ModeDivision;

    @Column()
    name!: string;

    @Column()
    abbreviation!: string;

    @Column()
    description!: string;

    @Column()
    server!: string;

    @OneToMany(() => TournamentRole, role => role.tournament)
    roles!: TournamentRole[];

    @OneToMany(() => TournamentChannel, channel => channel.tournament)
    channels!: TournamentChannel[];

    @Column({ type: "year" })
    year!: number;

    @Column()
    matchSize!: number;

    @Column({ type: "enum", enum: SortOrder, default: SortOrder.Signup })
    regSortOrder!: SortOrder;

    @Column({ default: false })
    isOpen!: boolean;

    @Column({ default: false })
    isClosed!: boolean;

    @Column({ default: false })
    invitational!: boolean;

    @Column()
    minTeamSize!: number;

    @Column()
    maxTeamSize!: number;

    @OneToMany(() => Stage, stage => stage.tournament)
    stages!: Stage[];

    @Column(() => Phase)
    registrations!: Phase;

    @Column({ default: false })
    publicQualifiers!: boolean;

    @Column({ type: "enum", enum: TournamentStatus, default: TournamentStatus.NotStarted })
    status!: TournamentStatus;

}