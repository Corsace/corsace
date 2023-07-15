import { Matchup } from "../../../../Models/tournaments/matchup";
import { StageType } from "../../../../Interfaces/stage";
import getUser from "../../../../Server/functions/get/getUser";

export default async function allAllowedUsersForMatchup (matchup: Matchup) {
    if (!matchup.stage)
        throw new Error("Matchup has no stage");

    const botUsers = await Promise.all([
        { osu: { username: "Corsace", userID: "29191632" } },
        { osu: { username: "BanchoBot", userID: "3" } },
    ].map((user) => getUser(user.osu.userID, "osu", true)));
    
    if (matchup.stage.stageType === StageType.Qualifiers)
        return matchup.teams!
            .flatMap(team => team.members.concat(team.manager))
            .concat(botUsers)
            .filter((v, i, a) => a.findIndex(t => t.ID === v.ID) === i);

    return matchup.team1!.members
        .concat(
            matchup.team1!.manager, 
            matchup.team2!.members, 
            matchup.team2!.manager, 
            botUsers
        )
        .filter((v, i, a) => a.findIndex(t => t.ID === v.ID) === i);
}