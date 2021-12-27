import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { RequestStatus } from "../../Interfaces/requests";
import { Team } from "./team";
import { User } from "../user";
import { TeamInvitationInfo } from "../../Interfaces/teaminvitation";

@Entity()
export class TeamInvitation extends BaseEntity {

    @PrimaryGeneratedColumn()
    ID!: number;

    @ManyToOne(() => User, user => user.invitations)
    target!: User;

    @ManyToOne(() => Team, team => team.invitations)
    team!: Team;

    @Column({ type: "enum", enum: RequestStatus, default: RequestStatus.Pending })
    status!: RequestStatus;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    dateCreated!: Date;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    lastUpdate!: Date;

    public getInfo = async function(this: TeamInvitation): Promise<TeamInvitationInfo> {
        const info: TeamInvitationInfo = {
            ID: this.ID,
            target: await this.target.getInfo(),
            team: await this.team.getInfo(),
            status: this.status,
            dateCreated: this.dateCreated,
            lastUpdate: this.lastUpdate,
        };
        return info;
    }
    
}