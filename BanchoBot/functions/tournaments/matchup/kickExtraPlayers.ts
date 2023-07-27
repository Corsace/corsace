import { BanchoLobby, BanchoLobbyPlayer } from "bancho.js";
import { StageType } from "../../../../Interfaces/stage";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { Team } from "../../../../Models/tournaments/team";
import allPlayersInMatchup from "./allPlayersInMatchup";

export default async function kickExtraPlayers (matchup: Matchup, playersInLobby: BanchoLobbyPlayer[], lobby: BanchoLobby) {
    if (allPlayersInMatchup(matchup, playersInLobby))
        return;

    const numMembersInLobby = (team: Team) => team.members.filter(m => 
        playersInLobby.some(p => p.user.id.toString() === m.osu.userID)
    ).length;

    if (matchup.stage!.stageType === StageType.Qualifiers)
        for (const team of matchup.teams!) {
            const numMembers = numMembersInLobby(team);
            if (numMembers > matchup.stage!.tournament.matchupSize) {
                // Take numMembers-matcupSize number of players to kick randomly from the team until we have the correct number of players.
                const playersToKick = team.members
                    .filter(m =>
                        playersInLobby.some(p => p.user.id.toString() === m.osu.userID)
                    )
                    .sort(() => Math.random() - 0.5)
                    .slice(matchup.stage!.tournament.matchupSize)
                    .map(m => playersInLobby.find(p => p.user.id.toString() === m.osu.userID)!.user.ircUsername);
                await Promise.all(playersToKick.map(p => lobby.kickPlayer(p)));
            }
        }
}