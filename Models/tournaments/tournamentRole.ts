import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Tournament } from "./tournament";
import { User } from "../user";
import { TournamentRoleType } from "../../Interfaces/tournament";
@Entity()
export class TournamentRole extends BaseEntity {

    @PrimaryGeneratedColumn()
        ID!: number;

    @CreateDateColumn()
        createdAt!: Date;

    @ManyToOne(() => User, user => user.tournamentRolesCreated, {
        nullable: false,
    })
        createdBy!: User;

    @Column()
        roleID!: string;

    @ManyToOne(() => Tournament, tournament => tournament.channels, {
        nullable: false,
    })
        tournament!: Tournament;

    @Column({ type: "enum", enum: TournamentRoleType })
        roleType!: TournamentRoleType;
}