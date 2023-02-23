import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Tournament } from "./tournament";

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
}

@Entity()
export class TournamentRole extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    roleID!: string;

    @ManyToOne(() => Tournament, tournament => tournament.channels)
    tournament!: Tournament;

    @Column({ type: "enum", enum: TournamentRoleType })
    roleType!: TournamentRoleType;

}