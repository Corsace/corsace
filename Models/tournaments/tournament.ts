import { BaseEntity, Check, Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ModeDivision } from "../MCA_AYIM/modeDivision";
import { Phase } from "../phase";
import { User } from "../user";
import { Stage } from "./stage";
import { TournamentChannel } from "./tournamentChannel";
import { TournamentRole } from "./tournamentRole";
import { Team } from "./team";

export enum SortOrder {
    Signup,
    Random,
    RankPP,
    BWS,
}

export const sortOrderHash = {
    "signup": SortOrder.Signup,

    "random": SortOrder.Random,

    "rank": SortOrder.RankPP,
    "pp": SortOrder.RankPP,
    "rankpp": SortOrder.RankPP,

    "bws": SortOrder.BWS,
};

export function sortTextToOrder (sort: string | null | undefined): number {
    if (!sort)
        return -1;
    return sortOrderHash[sort.trim().toLowerCase()] ?? -1;
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
@Check(`"matchupSize" <= "minTeamSize"`)
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

    @Column("text")
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
        matchupSize!: number;

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

    @Column({ default: false })
        warmups!: boolean;

    @Column("integer", { nullable: true })
        mapTimer?: number | null;

    @Column("integer", { nullable: true })
        readyTimer?: number | null;

    @Column("integer", { nullable: true })
        abortThreshold?: number | null;

    @Column("integer", { nullable: true, default: 1 })
        teamAbortLimit?: number | null;

    @OneToMany(() => Stage, stage => stage.tournament)
        stages!: Stage[];

    @Column(() => Phase)
        registrations!: Phase;

    @ManyToMany(() => Team, team => team.tournaments)
    @JoinTable()
        teams!: Team[];

    @Column({ default: false })
        publicQualifiers!: boolean;

    @Column({ type: "enum", enum: TournamentStatus, default: TournamentStatus.NotStarted })
        status!: TournamentStatus;

    @Column({ type: "varchar", length: 128, unique: true, select: false, nullable: true })
        key!: string | null;
}