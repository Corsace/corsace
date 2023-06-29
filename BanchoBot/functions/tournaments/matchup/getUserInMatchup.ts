import { BanchoMessage } from "bancho.js";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { StageType } from "../../../../Models/tournaments/stage";
import { User } from "../../../../Models/user";
import getUser from "../../../../Server/functions/get/getUser";

export default async function getUserInMatchup (message: BanchoMessage, matchup: Matchup): Promise<User> {
    if (!matchup.stage)
        throw new Error("Matchup has no stage");

    let user: User | undefined = undefined;
    if (matchup.stage.stageType === StageType.Qualifiers)
        user = matchup.teams!.flatMap(team => team.members.concat(team.manager)).find(player => player.osu.userID === message.user.id.toString());
    else
        user = matchup.team1!.members.concat(matchup.team1!.manager, matchup.team2!.members, matchup.team2!.manager).find(player => player.osu.userID === message.user.id.toString());

    if (user)
        return user;
    
    return getUser(message.user.id, "osu", true);
}