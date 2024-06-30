import { BanchoLobby } from "bancho.js";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { StageType } from "../../../../Interfaces/stage";

export default async function invitePlayersToLobby (matchup: Matchup, mpLobby: BanchoLobby) {
    const IDs: {
        osu: string;
        discord: string;
    }[] = [];

    if (matchup.stage!.stageType === StageType.Qualifiers) {
        const users = matchup.teams!.flatMap(team => team.members.concat(team.captain).filter((v, i, a) => a.findIndex(t => t.ID === v.ID) === i));
        await Promise.all(users.map(user => mpLobby.invitePlayer(`#${user.osu.userID}`)));
        IDs.push(...users.map(u => ({ osu: u.osu.userID, discord: u.discord.userID })));
    } else {
        const users = matchup.team1!.members.concat(matchup.team1!.captain).concat(matchup.team2!.members).concat(matchup.team2!.captain).filter((v, i, a) => a.findIndex(t => t.ID === v.ID) === i);
        await Promise.all(users.map(m => mpLobby.invitePlayer(`#${m.osu.userID}`)));
        IDs.push(...users.map(u => ({ osu: u.osu.userID, discord: u.discord.userID })));
    }

    return IDs;
}