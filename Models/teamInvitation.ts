
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { RequestStatus } from "../Interfaces/requests";
import { Team } from "./team";
import { User } from "./user";

@Entity()
export class TeamInvitation extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @Column()
    targetID!: number;

    @ManyToOne(() => User, user => user.invitations)
    target!: User;

    @Column()
    teamID!: number;
    
    @ManyToOne(() => Team, team => team.invitations)
    team!: Team;

    @Column({ type: "enum", enum: RequestStatus, default: RequestStatus.Pending })
    status!: RequestStatus;
}