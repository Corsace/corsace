import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { RequestStatus } from "../../Interfaces/requestStatus";
import { User } from "../user";
import { Team } from "./team";

@Entity()
export class TeamInvitation extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @ManyToOne(() => User, user => user.teamInvitations)
    target!: User;

    @ManyToOne(() => Team, team => team.invitations)
    team!: Team;

    @Column({ type: "enum", enum: RequestStatus, default: RequestStatus.Pending })
    status!: RequestStatus;

    @CreateDateColumn()
    createdAt!: Date;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    lastUpdate!: Date;

}