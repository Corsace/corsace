import { ChatInputCommandInteraction, PermissionFlagsBits, PermissionsBitField, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "../../index";
import respond from "../../../functions/respond";
import channelID from "../../../functions/channelID";
import getUser from "../../../../Server/functions/get/getUser";
import commandUser from "../../../functions/commandUser";
import { loginResponse } from "../../../functions/loginResponse";
import getTournament from "../../../functions/tournamentFunctions/getTournament";
import getStage from "../../../functions/tournamentFunctions/getStage";
import { extractParameter } from "../../../functions/parameterFunctions";

async function run (m: Message | ChatInputCommandInteraction) {
    if (!m.guild || !(m.member!.permissions as Readonly<PermissionsBitField>).has(PermissionFlagsBits.Administrator))
        return;

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

    stage.publicScores = !stage.publicScores;
    await stage.save();

    await respond(m, `Set \`${stage.name}'s\` scores public to ${stage.publicScores ? "true" : "false"}`);
}

const data = new SlashCommandBuilder()
    .setName("stage_scores")
    .setDescription("Publicize/Privatize scores.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false);

const stageScores: Command = {
    data,
    alternativeNames: ["scores_stage", "scores-stage","scoress", "sscores", "stages", "sstage", "stage-scores", "stagescores", "scoresstage"],
    category: "tournaments",
    subCategory: "stages",
    run,
};
    
export default stageScores;