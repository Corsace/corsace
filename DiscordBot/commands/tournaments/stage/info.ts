import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "../../index";
import respond from "../../../functions/respond";
import channelID from "../../../functions/channelID";
import getUser from "../../../../Server/functions/get/getUser";
import commandUser from "../../../functions/commandUser";
import { loginResponse } from "../../../functions/loginResponse";
import getTournament from "../../../functions/tournamentFunctions/getTournament";
import getStage from "../../../functions/tournamentFunctions/getStage";
import { ScoringMethod, StageType } from "../../../../Interfaces/stage";
import { discordStringTimestamp } from "../../../../Server/utils/dateParse";
import { Mappool } from "../../../../Models/tournaments/mappools/mappool";
import { Round } from "../../../../Models/tournaments/round";
import { extractParameter } from "../../../functions/parameterFunctions";
import { EmbedBuilder } from "../../../functions/embedHandlers";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const user = await getUser(commandUser(m).id, "discord", false);
    if (!user) {
        await loginResponse(m);
        return;
    }

    const tournament = await getTournament(m, channelID(m), "channel", undefined, true);
    if (!tournament)
        return;

    const stageParam = extractParameter(m, { name: "stage", paramType: "string" }, 1);

    const stage = await getStage(m, tournament, false, typeof stageParam === "string" ? stageParam : tournament.ID, typeof stageParam === "string" ? "name" : "tournamentID");
    if (!stage)
        return;

    const rounds = await Round
        .createQueryBuilder("round")
        .leftJoin("round.stage", "stage")
        .where("stage.ID = :ID", { ID: stage.ID })
        .getMany();

    const mappoolQ = Mappool
        .createQueryBuilder("mappool")
        .leftJoin("mappool.stage", "stage")
        .leftJoin("mappool.round", "round")
        .leftJoinAndSelect("mappool.slots", "slot")
        .leftJoinAndSelect("slot.maps", "map")
        .where("stage.ID = :ID", { ID: stage.ID });
    if (rounds.length > 0)
        mappoolQ.orWhere("round.ID IN (:...IDs)", { IDs: rounds.map(round => round.ID) });
    
    const mappools = await mappoolQ.getMany();

    // Create a discord embed for the stage, listing its rounds and mappools
    const embed = new EmbedBuilder()
        .setTitle(`${stage.name} (${stage.abbreviation})`)
        .setDescription(`**ID:** ${stage.ID}\n**Type:** ${StageType[stage.stageType]}\n**Scoring Method:** ${ScoringMethod[stage.scoringMethod]}\n**Start Date:** ${discordStringTimestamp(stage.timespan.start)}\n**End Date:** ${discordStringTimestamp(stage.timespan.end)}`)
        .addFields(
            { 
                name: "Rounds", 
                value: rounds.map(round => `**${round.name} (${round.abbreviation})**`).join("\n") || "None",
                inline: true,
            },
            { 
                name: "Mappools",
                value: mappools.map(mappool => `**${mappool.name} (${mappool.abbreviation})**\n${mappool.slots.map(slot => `${slot.name} (${slot.acronym}): ${slot.maps.length} map${slot.maps.length > 1 ? "s" : ""}`).join("\n")}`).join("\n\n") || "None",
                inline: true,
            }
        );

    // Send the embed
    await respond(m, undefined, embed);
}

const data = new SlashCommandBuilder()
    .setName("stage_info")
    .setDescription("Get info for a stage.")
    .addStringOption(option => 
        option.setName("stage")
            .setDescription("The stage to get info for (not required).")
            .setRequired(false));

const stageInfo: Command = {
    data,
    alternativeNames: [ "info_stage", "info-stage","infos", "sinfo", "stagei", "istage", "stage-info", "stageinfo", "infostage", "is", "si" ],
    category: "tournaments",
    subCategory: "stages",
    run,
};
    
export default stageInfo;