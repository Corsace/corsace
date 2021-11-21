import { BaseEntity, Column, Entity } from "typeorm";
import { QualifierPlayInfo } from "../../Interfaces/qualifier";
import { TeamInfo } from "../../Interfaces/team";
import { MatchPlay } from "./matchPlay";
import { Team } from "./team";

@Entity()
export class QualifierPlay extends MatchPlay {
    @Column()
    team!: number;

    public getInfo = async function(this: QualifierPlay, teams: TeamInfo[]): Promise<QualifierPlayInfo> {
        const team = teams ? teams.find(team => team.id === this.team.toString()) : null;
        return {
            mapID: this.beatmap,
            team: this.team.toString(),
            score: this.score,
            userOsuID: team ? team.members.find((user) => user.id === this.user.ID).osuID : (await (await User.findById(this.play.user)).getInfo()).osuID,
        };
    };
    
    public getTeam = async function(this: QualifierPlay): Promise<Team | undefined> {
        if(this.team)
            return await Team.findOne(this.team);
    };
    
}