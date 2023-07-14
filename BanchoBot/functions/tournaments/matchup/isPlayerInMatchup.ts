import { Matchup } from "../../../../Models/tournaments/matchup";
import { StageType } from "../../../../Interfaces/stage";
import { Team } from "../../../../Models/tournaments/team";

export default function isPlayerInMatchup (matchup: Matchup, playerID: string, checkManager: boolean): boolean {
    const isPlayerInTeam = (team: Team) =>
        (checkManager && team.manager.osu.userID === playerID) ||
        team.members.some(player => player.osu.userID === playerID);

    if (matchup.stage!.stageType === StageType.Qualifiers)
        return matchup.teams!.some(isPlayerInTeam);
    else
        return isPlayerInTeam(matchup.team1!) || isPlayerInTeam(matchup.team2!);
}