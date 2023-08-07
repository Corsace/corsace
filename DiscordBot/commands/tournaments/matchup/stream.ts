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
import confirmCommand from "../../../functions/confirmCommand";
import respond from "../../../functions/respond";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    if (!await securityChecks(m, true, false, [], [TournamentRoleType.Organizer, TournamentRoleType.Streamers]))
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
        .leftJoinAndSelect("matchup.streamer", "streamer")
        .where("matchup.ID = :ID", { ID: matchupID })
        .getOne();

    if (!matchup) {
        await m.reply("Invalid matchup ID provided");
        return;
    }

    if (matchup.mp) {
        await respond(m, "This matchup has already been played");
        return;
    }

    if (matchup.streamer?.ID === user.ID) {
        matchup.streamer = null;
        await matchup.save();
        await respond(m, `Ok ur not the streamer for matchup \`${matchup.ID}\` anymore`);
        return;
    }

    if (matchup.streamer && matchup.streamer.ID !== user.ID && !await confirmCommand(m, `<@${matchup.streamer.discord.userID}> do u allow \`${user.osu.username}\` to be the streamer for matchup \`${matchup.ID}\`?`, true, matchup.streamer.discord.userID)) {
        await respond(m, "Ok w/e .");
        return;
    }

    matchup.streamer = user;
    await matchup.save();
    await respond(m, `Ur now the streamer for matchup \`${matchup.ID}\``);
}

const data = new SlashCommandBuilder()
    .setName("matchup_streamer")
    .setDescription("Assign or remove yourself as a streamer for a matchup")
    .addIntegerOption(option =>
        option.setName("matchup")   
            .setDescription("The ID of the matchup to assign/remove yourself as a streamer")
            .setRequired(true))
    .setDMPermission(false);

const matchupStreamer: Command = {
    data,
    alternativeNames: ["streamer_matchup", "streamer-matchup", "matchup-streamer", "matchupstreamer", "streamermatchup", "streamerm", "mstreamer", "matchups", "smatchup", "matchup_stream", "stream_matchup", "stream-matchup", "matchup-stream", "matchupstream", "streammatchup", "streamm", "mstream"],
    category: "tournaments",
    subCategory: "matchups",
    run,
};

export default matchupStreamer;
