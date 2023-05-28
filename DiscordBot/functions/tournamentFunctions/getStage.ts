import { ChatInputCommandInteraction, Message } from "discord.js";
import { Tournament } from "../../../Models/tournaments/tournament";
import respond from "../respond";
import getFromList from "../getFromList";
import getStages from "../dbFunctions/getStages";
import getTournament from "./getTournament";

export default async function getStage (m: Message | ChatInputCommandInteraction, tournament?: Tournament, useChannel?: boolean) {
    tournament = tournament ?? await getTournament(m, useChannel ? m.channelId : m.guildId || "", useChannel ? "channel" : m.guild ? "server" : "ID");
    if (!tournament)
        return;

    const stages = tournament.stages.length > 0 ? tournament.stages : await getStages(tournament.ID, "tournamentID", true, false);
    if (stages.length === 0) {
        await respond(m, "This tournament currently has no stages. Please create a stage first.");
        return;
    }

    const stage = await getFromList(m, stages, "stage");
    if (!stage)
        return;

    return stage;
}