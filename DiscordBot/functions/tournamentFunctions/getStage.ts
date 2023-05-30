import { ChatInputCommandInteraction, Message } from "discord.js";
import { Tournament } from "../../../Models/tournaments/tournament";
import respond from "../respond";
import getFromList from "../getFromList";
import getStages, { stageSearchConditions } from "../dbFunctions/getStages";
import getTournament from "./getTournament";
import { Stage } from "../../../Models/tournaments/stage";

export default async function getStage (m: Message | ChatInputCommandInteraction, tournament?: Tournament, useChannel?: boolean, target: string | number | undefined = tournament?.ID, searchType: undefined | keyof typeof stageSearchConditions = "tournamentID") {
    tournament = tournament ?? await getTournament(m, useChannel ? m.channelId : m.guildId || "", useChannel ? "channel" : m.guild ? "server" : "ID");
    if (!tournament)
        return;

    let stages: Stage[] = [];
    if (tournament.stages.length > 0) {
        if (searchType === "ID" && typeof target === "number")
            stages = tournament.stages.filter(s => s.ID === target);
        else if (searchType === "name" && typeof target === "string")
            stages = tournament.stages.filter(s => s.name.toLowerCase() === target.toLowerCase() || s.abbreviation.toLowerCase() === target.toLowerCase());
        else
            stages = tournament.stages;
    } else
        stages = await getStages(target || tournament.ID, searchType || "tournamentID", true, false);

    if (stages.length === 0) {
        await respond(m, "THE TOURNAMENT HAS NO STAGES CREATE A STAGE FIRST .");
        return;
    }

    const stage = await getFromList(m, stages, "stage", target?.toString() || tournament.ID.toString());
    if (!stage)
        return;

    return stage;
}