import { Team } from "./team";
import { BaseEntity, Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { TeamInfo } from "../../Interfaces/team";
import { TeamInviteInfo } from "../../Interfaces/teaminvite";
import { User } from "../user";

@Entity()
export class TeamInvite extends BaseEntity {
    @PrimaryColumn()
    osuUserID!: number;

    @PrimaryColumn()
    team!: Team;
    
    @Column()
    osuUsername!: string;

    @Column({ default: "PENDING" })
    status!: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED";

    @Column({ default: Date.now })
    dateCreated!: Date;

    @Column({ default: Date.now })
    lastUpdate!: Date;

    public getInfo = async function(this: TeamInvite, populate = true): Promise<TeamInviteInfo> {
        return {
            osuUserID: this.osuUserID,
            osuUsername: this.osuUsername,
            team: await this.team.getInfo(),
            status: this.status,
            dateCreated: this.dateCreated,
            lastUpdate: this.lastUpdate,
        };
    };
    
    public getTeam = async function(this: TeamInvite): Promise<Team | undefined> { 
        // should prob do some foreign key shit to guarantee this doesn't happen ? idk shit
        return await Team.findOne(this.team);
    };
    
    public getUser = async function(this: TeamInvite): Promise<User> {
        return await User.findOne({ where: {
            osu: {
                userID: this.osuUserID,
            } 

        }} as any); // TODO: what the hell.
    };
    
}