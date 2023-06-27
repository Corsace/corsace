import { BanchoLobbyPlayer } from "bancho.js";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { StageType } from "../../../../Models/tournaments/stage";
import { Team } from "../../../../Models/tournaments/team";

export default function allPlayersInLobby (matchup: Matchup, playersInLobby: BanchoLobbyPlayer[]) {
    const numMembersInLobby = (team: Team) => team.members.filter(m => 
        playersInLobby.some(p => p.user.id.toString() === m.osu.userID)
    ).length;

    if (matchup.stage!.stageType === StageType.Qualifiers)
        return matchup.teams!.map(numMembersInLobby).every(n => n === matchup.stage!.tournament.matchupSize);

    return numMembersInLobby(matchup.team1!) === matchup.stage!.tournament.matchupSize &&
        numMembersInLobby(matchup.team2!) === matchup.stage!.tournament.matchupSize;
}