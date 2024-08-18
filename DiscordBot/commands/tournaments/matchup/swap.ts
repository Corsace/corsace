import { Message, SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../../index";
import { extractParameters } from "../../../functions/parameterFunctions";
import respond from "../../../functions/respond";
import getTournament from "../../../functions/tournamentFunctions/getTournament";
import { TournamentRoleType, unallowedToPlay } from "../../../../Interfaces/tournament";
import channelID from "../../../functions/channelID";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";
import confirmCommand from "../../../functions/confirmCommand";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    if (!await securityChecks(m, true, true, [], [...unallowedToPlay, TournamentRoleType.Streamers]))
        return;

    const params = await extractParameters<parameters>(m, [
        { name: "matchup", paramType: "string" },
        { name: "tournament", paramType: "string", optional: true },
    ]);
    if (!params)
        return;

    const { matchup: matchupID, tournament: tournamentParam } = params;

    const tournament = await getTournament(m, typeof tournamentParam === "string" ? tournamentParam : channelID(m), typeof tournamentParam === "string" ? "name" : "channel", undefined, true);
    if (!tournament)
        return;

    const matchup = await Matchup
        .createQueryBuilder("matchup")
        .leftJoinAndSelect("matchup.team1", "team1")
        .leftJoinAndSelect("matchup.team2", "team2")
        .where("(matchup.ID = :matchupID OR matchup.matchID = :matchupID)", { matchupID })
        .andWhere("tournament.ID = :tournamentID", { tournamentID: tournament.ID })
        .getOne();
    if (!matchup) {
        await respond(m, `Matchup ID \`${matchupID}\` not found in tournament \`${tournament.name}\``);
        return;
    }

    if (!confirmCommand(m, `Are you sure you want to swap the teams for matchup ID \`${matchup.matchID}\`?\nTeam 1: ${matchup.team1?.name ?? "N/A"}\nTeam 2: ${matchup.team2?.name ?? "N/A"}`))
        return;

    const temp = matchup.team1;
    matchup.team1 = matchup.team2;
    matchup.team2 = temp;
    await matchup.save();

    await respond(m, `Teams for matchup ID \`${matchup.matchID}\` have been swapped\nTeam 1: ${matchup.team1?.name ?? "N/A"}\nTeam 2: ${matchup.team2?.name ?? "N/A"}`);
}

const data = new SlashCommandBuilder()
    .setName("matchup_swap")
    .setDescription("Swap teams on a matchup")
    .addStringOption(option => 
        option.setName("matchup")
            .setDescription("The ID of the matchup to swap")
            .setRequired(true))
    .addStringOption(option => 
        option.setName("tournament")
            .setDescription("The tournament to search the matchup in")
            .setRequired(false))
    .setDMPermission(false);

interface parameters {
    matchup: string,
    tournament?: string,
}

const matchupSwap: Command = {
    data,
    alternativeNames: [ "swap_matchup", "swap-matchup", "matchup-swap", "matchupswap", "swapmatchup", "swapm", "mswap" ],
    category: "tournaments",
    subCategory: "matchups",
    run,
};

export default matchupSwap;
