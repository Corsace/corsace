import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Tournament } from "./tournament";
import { User } from "../user";

export enum TournamentRoleType {
    Organizer,
    Participants,
    Managers,
    Mappoolers,
    Mappers,
    Testplayers,
    Referees,
    Streamers,
    Commentators,
    Staff,
}

export const unallowedToPlay = [
    TournamentRoleType.Organizer,
    TournamentRoleType.Mappoolers,
    TournamentRoleType.Mappers,
    TournamentRoleType.Testplayers,
    TournamentRoleType.Referees,
];

@Entity()
export class TournamentRole extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @CreateDateColumn()
        createdAt!: Date;

    @ManyToOne(() => User, user => user.tournamentRolesCreated)
        createdBy!: User;

    @Column()
        roleID!: string;

    @ManyToOne(() => Tournament, tournament => tournament.channels)
        tournament!: Tournament;

    @Column({ type: "enum", enum: TournamentRoleType })
        roleType!: TournamentRoleType;

}