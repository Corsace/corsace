import { BanchoLobby } from "bancho.js";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { StageType } from "../../../../Models/tournaments/stage";

export default async function invitePlayersToLobby (matchup: Matchup, mpLobby: BanchoLobby) {
    if (matchup.stage!.stageType === StageType.Qualifiers) {
        const users = matchup.teams!.flatMap(team => team.members.concat(team.manager).filter((v, i, a) => a.findIndex(t => t.ID === v.ID) === i));
        await Promise.all(users.map(user => mpLobby.invitePlayer(`#${user.osu.userID}`)));
    } else {
        const users = matchup.team1!.members.concat(matchup.team1!.manager).concat(matchup.team2!.members).concat(matchup.team2!.manager).filter((v, i, a) => a.findIndex(t => t.ID === v.ID) === i);
        await Promise.all(users.map(m => mpLobby.invitePlayer(`#${m.osu.userID}`)));
    }
}