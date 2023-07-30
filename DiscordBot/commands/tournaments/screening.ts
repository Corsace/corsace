import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "..";
import { Team } from "../../../Models/tournaments/team";
import { extractParameter } from "../../functions/parameterFunctions";
import getTournament from "../../functions/tournamentFunctions/getTournament";
import channelID from "../../functions/channelID";
import respond from "../../functions/respond";

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const tournamentParam = extractParameter(m, { name: "tournament", paramType: "string" }, 1);

    const tournament = await getTournament(m, typeof tournamentParam === "string" ? tournamentParam : channelID(m), typeof tournamentParam === "string" ? "name" : "channel", undefined, true, true);
    if (!tournament)
        return;

    const teams = await Team
        .createQueryBuilder("team")
        .leftJoinAndSelect("team.manager", "manager")
        .leftJoinAndSelect("team.members", "member")
        .leftJoin("team.tournaments", "tournament")
        .where("tournament.ID = :tournamentID", { tournamentID: tournament.ID })
        .getMany();

    const csv = teams.map(t => {
        const members = t.members;
        if (!members.some(m => m.ID === t.manager.ID))
            members.push(t.manager);
        return members.map(m => `${m.osu.username},${t.name},${m.osu.userID}`).join("\n");
    }).join("\n");

    await respond(m, "Here's the screening sheet to send to osu! staff.", undefined, undefined, [{
        name: `${tournament.name} - Screening Sheet.csv`,
        attachment: Buffer.from(csv),
    }]);
}

const data = new SlashCommandBuilder()
    .setName("tournament_screening")
    .setDescription("Get a generated csv of players for osu! screening.")
    .addStringOption(option => 
        option.setName("tournament")
            .setDescription("The tournament to get the screening sheet for (not required).")
            .setRequired(false));

const tournamentScreening: Command = {
    data,
    alternativeNames: [ "screening_tournament", "screening-tournament","screeningt", "tscreening", "tournaments", "stournament", "tournament-screening", "tournamentscreening", "screeningtournament", "ts", "screen_tournament", "screen-tournament","screent", "tscreen", "tournaments", "stournament", "tournament-screen", "tournamentscreen", "screentournament" ],
    category: "tournaments",
    run,
};
    
export default tournamentScreening;