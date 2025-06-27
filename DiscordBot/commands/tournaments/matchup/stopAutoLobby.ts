import Axios from "axios";
import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { config } from "node-config-ts";
import { Command } from "../..";
import { TournamentRoleType } from "../../../../Interfaces/tournament";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { extractParameter } from "../../../functions/parameterFunctions";
import respond from "../../../functions/respond";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";
import getTournament from "../../../functions/tournamentFunctions/getTournament";
import channelID from "../../../functions/channelID";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    if (!await securityChecks(m, true, false, [], [TournamentRoleType.Organizer, TournamentRoleType.Referees, TournamentRoleType.Streamers]))
        return;

    const tournament = await getTournament(m, channelID(m), "channel", undefined, true);
    if (!tournament)
        return;

    const ID = extractParameter(m, { name: "matchup", paramType: "string" }, 1);

    const matchup = await Matchup
        .createQueryBuilder("matchup")
        .where("(matchup.ID = :ID OR matchup.matchID = :ID)", { ID })
        .andWhere("tournament.ID = :tournamentID", { tournamentID: tournament.ID })
        .getOne();

    if (!matchup?.baseURL) {
        await respond(m, "Invalid matchup ID OR the matchup isnt even running");
        return;
    }

    const baseUrl = matchup.baseURL;

    const { data } = await Axios.post(`${baseUrl}/api/bancho/stopAutoLobby`, {
        matchupID: ID,
    }, {
        auth: config.interOpAuth,
    });

    if (!data.success) {
        await respond(m, data.error);
        return;
    }

    await respond(m, "Successfully stopped auto lobby. You or any other ref/organizer can now run the lobby manually.");
}

const data = new SlashCommandBuilder()
    .setName("stop_auto_lobby")
    .setDescription("Stop the Corsace bancho bot from auto-running a lobby for a matchup.")
    .addIntegerOption((option) =>
        option.setName("matchup")
            .setDescription("The ID of the matchup.")
            .setRequired(true))
    .setDMPermission(false);

const stopAutoLobby: Command = {
    data,
    alternativeNames: ["stop-auto-lobby", "stopauto", "stopauto-lobby", "stopautol", "stopal", "stopalobby"],
    category: "tournaments",
    subCategory: "matchups",
    run,
};

export default stopAutoLobby;
