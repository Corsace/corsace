import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { config } from "node-config-ts";
import { Command } from "../..";
import { TournamentRoleType } from "../../../../Interfaces/tournament";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { extractParameter } from "../../../functions/parameterFunctions";
import respond from "../../../functions/respond";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";
import { post } from "../../../../Server/utils/fetch";
import { basicAuth } from "../../../../Server/utils/auth";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    if (!await securityChecks(m, true, false, [], [TournamentRoleType.Organizer, TournamentRoleType.Referees, TournamentRoleType.Streamers]))
        return;

    const ID = extractParameter(m, { name: "id", paramType: "number" }, 1);
    if (!ID || typeof ID !== "number") {
        await respond(m, "Provide an actual matchup ID");
        return;
    }

    const matchup = await Matchup
        .createQueryBuilder("matchup")
        .where("matchup.ID = :ID", { ID })
        .getOne();

    if (!matchup?.baseURL) {
        await respond(m, "Invalid matchup ID OR the matchup isnt even running OR the matchup doesnt ahve a bancho web service associated with it either way it wont work");
        return;
    }

    const baseUrl = matchup.baseURL;
    const data = await post(`${baseUrl}/api/bancho/stopAutoLobby`, {
        matchupID: ID,
    }, {
        headers: {
            Authentication: basicAuth(config.interOpAuth),
        },
    });

    if (!data.success) {
        await respond(m, typeof data.error === "string" ? data.error : data.error.message);
        return;
    }

    await respond(m, "Successfully stopped auto lobby. You or any other ref/organizer can now run the lobby manually.");
}

const data = new SlashCommandBuilder()
    .setName("stop_auto_lobby")
    .setDescription("Stop the Corsace bancho bot from auto-running a lobby for a matchup.")
    .addIntegerOption((option) =>
        option.setName("id")
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