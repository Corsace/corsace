import { Message, SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../../index";
import { extractParameters } from "../../../functions/parameterFunctions";
import respond from "../../../functions/respond";
import getTournament from "../../../functions/tournamentFunctions/getTournament";
import { TournamentRoleType, unallowedToPlay } from "../../../../Interfaces/tournament";
import channelID from "../../../functions/channelID";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    if (!await securityChecks(m, true, true, [], [...unallowedToPlay, TournamentRoleType.Streamers]))
        return;

    const params = await extractParameters<parameters>(m, [
        { name: "link", paramType: "string" },
        { name: "matchup", paramType: "string" },
        { name: "tournament", paramType: "string", optional: true },
    ]);
    if (!params)
        return;

    const { link, matchup: matchupID, tournament: tournamentParam } = params;

    const tournament = await getTournament(m, typeof tournamentParam === "string" ? tournamentParam : channelID(m), typeof tournamentParam === "string" ? "name" : "channel", undefined, true);
    if (!tournament)
        return;

    const matchup = await Matchup
        .createQueryBuilder("matchup")
        .innerJoin("matchup.stage", "stage")
        .innerJoin("stage.tournament", "tournament")
        .where("(matchup.ID = :matchupID OR matchup.matchID = :matchupID)", { matchupID })
        .andWhere("tournament.ID = :tournamentID", { tournamentID: tournament.ID })
        .getOne();
    if (!matchup) {
        await respond(m, `Matchup ID \`${matchupID}\` not found in tournament \`${tournament.name}\``);
        return;
    }

    matchup.vod = link;
    await matchup.save();

    await respond(m, `Vod for matchup ID \`${matchup.matchID}\` has been set to ${link}`);
}

const data = new SlashCommandBuilder()
    .setName("matchup_vod")
    .setDescription("Add vod to matchup")
    .addStringOption(option =>
        option.setName("link")
            .setDescription("Link to the vod of the matchup")
            .setRequired(true))
    .addStringOption(option => 
        option.setName("matchup")
            .setDescription("The ID of the matchup to attach the vod to")
            .setRequired(true))
    .addStringOption(option => 
        option.setName("tournament")
            .setDescription("The tournament to reschedule for")
            .setRequired(false))
    .setDMPermission(false);

interface parameters {
    link: string,
    matchup: string,
    tournament?: string,
}

const matchupVod: Command = {
    data,
    alternativeNames: [ "vod_matchup", "vod-matchup", "matchup-vod", "matchupvod", "vodmatchup", "vodm", "mvod", "matchup_v", "v_matchup", "v-matchup", "matchup-v", "matchupv", "vmatchup", "vm", "mv" ],
    category: "tournaments",
    subCategory: "matchups",
    run,
};

export default matchupVod;
