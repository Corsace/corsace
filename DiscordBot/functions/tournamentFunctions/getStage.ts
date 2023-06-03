import { ChatInputCommandInteraction, Message } from "discord.js";
import { Tournament } from "../../../Models/tournaments/tournament";
import respond from "../respond";
import getFromList from "../getFromList";
import getStages, { stageSearchConditions } from "../dbFunctions/getStages";
import getTournament from "./getTournament";
import { Stage } from "../../../Models/tournaments/stage";
import channelID from "../channelID";

export default async function getStage (m: Message | ChatInputCommandInteraction, tournament?: Tournament, useChannel?: boolean, target: string | number | undefined = tournament?.ID, searchType: undefined | keyof typeof stageSearchConditions = "tournamentID") {
    tournament = tournament ?? await getTournament(m, useChannel ? channelID(m) : m.guildId || "", useChannel ? "channel" : m.guild ? "server" : "ID");
    if (!tournament)
        return;

    let stages: Stage[] = [];
    if (tournament.stages.length > 0) {
        if (searchType === "ID" && typeof target === "number")
            stages = tournament.stages.filter(s => s.ID === target);
        else if (searchType === "name" && typeof target === "string")
            if (target.length <= 4)
                stages = tournament.stages.filter(s => 
                    s.abbreviation.toLowerCase().includes(target.toLowerCase()) ||
                    target.toLowerCase().includes(s.abbreviation.toLowerCase())
                );
            else
                stages = tournament.stages.filter(s => 
                    s.name.toLowerCase().includes(target.toLowerCase()) ||
                    target.toLowerCase().includes(s.name.toLowerCase())
                );
        else
            stages = tournament.stages;

        if (stages.length === 0)
            stages = await getStages(target || tournament.ID, searchType || "tournamentID", true, false);
    } else
        stages = await getStages(target || tournament.ID, searchType || "tournamentID", true, false);

    if (stages.length === 0) {
        await respond(m, `THE TOURNAMENT HAS NO STAGES WITH QUERY \`${target}\` QUERY TYPE \`${searchType}\` CREATE A STAGE FIRST .`);
        return;
    }

    const stage = await getFromList(m, stages, "stage", target?.toString() || tournament.ID.toString());
    if (!stage)
        return;

    return stage;
}