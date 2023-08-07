import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "../..";
import { TournamentRoleType } from "../../../../Interfaces/tournament";
import { securityChecks } from "../../../functions/tournamentFunctions/securityChecks";
import getUser from "../../../../Server/functions/get/getUser";
import commandUser from "../../../functions/commandUser";
import { loginResponse } from "../../../functions/loginResponse";
import { Matchup } from "../../../../Models/tournaments/matchup";
import { extractParameter } from "../../../functions/parameterFunctions";
import getTournament from "../../../functions/tournamentFunctions/getTournament";
import channelID from "../../../functions/channelID";
import respond from "../../../functions/respond";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    if (!await securityChecks(m, true, false, [], [TournamentRoleType.Organizer, TournamentRoleType.Commentators]))
        return;

    const user = await getUser(commandUser(m).id, "discord", false);
    if (!user) {
        await loginResponse(m);
        return;
    }

    const tournament = await getTournament(m, channelID(m), "channel", undefined, true);
    if (!tournament)
        return;

    const matchupID = extractParameter(m, { name: "matchup", paramType: "integer" }, 1);
    if (!matchupID || typeof matchupID !== "number") {
        await m.reply("Provide an actual matchup ID");
        return;
    }

    const matchup = await Matchup
        .createQueryBuilder("matchup")
        .innerJoinAndSelect("matchup.stage", "stage")
        .innerJoinAndSelect("stage.tournament", "tournament")
        .leftJoinAndSelect("matchup.commentators", "commentators")
        .where("matchup.ID = :ID", { ID: matchupID })
        .getOne();

    if (!matchup) {
        await m.reply("Invalid matchup ID provided");
        return;
    }

    if (matchup.commentators?.some(c => c.ID === user.ID)) {
        matchup.commentators = matchup.commentators.filter(c => c.ID !== user.ID);
        await matchup.save();
        await respond(m, `Ok ur not the comm for matchup \`${matchup.ID}\` anymore`);
        return;
    }

    if (matchup.commentators && matchup.commentators.length === 3) {
        await respond(m, "This matchup already has 3 commentators any more would be 2 much :/");
        return;
    }

    if (matchup.commentators)
        matchup.commentators.push(user);
    else
        matchup.commentators = [user];
    await matchup.save();
    await respond(m, `Ur now a commentator for matchup \`${matchup.ID}\``);
}

const data = new SlashCommandBuilder()
    .setName("matchup_commentator")
    .setDescription("Assign or remove yourself as a commentator for a matchup")
    .addIntegerOption(option =>
        option.setName("matchup")   
            .setDescription("The ID of the matchup to assign/remove yourself as a commentator")
            .setRequired(true))
    .setDMPermission(false);

const matchupCommentator: Command = {
    data,
    alternativeNames: ["commentator_matchup", "commentator-matchup", "matchup-commentator", "matchupcommentator", "commentatormatchup", "commentatorm", "mcommentator", "matchupc", "cmatchup", "matchup_comm", "comm_matchup", "comm-matchup", "matchup-comm", "matchupcomm", "commmatchup", "commm", "mcomm"],
    category: "tournaments",
    subCategory: "matchups",
    run,
};

export default matchupCommentator;
