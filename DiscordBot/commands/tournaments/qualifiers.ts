import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "..";
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

    tournament.publicQualifiers = !tournament.publicQualifiers;
    await tournament.save();

    await respond(m, `Set qualifiers stage's scores public to ${tournament.publicQualifiers ? "true" : "false"}`);
}

const data = new SlashCommandBuilder()
    .setName("tournament_qualifiers")
    .setDescription("Set a qualifiers stage's scores public or private.")
    .addStringOption(option => 
        option.setName("tournament")
            .setDescription("The tournament to get its qualifiers scores public or private.")
            .setRequired(false));

const tournamentQualifiers: Command = {
    data,
    alternativeNames: [ "qualifiers_tournament", "qualifiers-tournament","qualifierst", "tqualifiers", "tournamentq", "qtournament", "tournament-qualifiers", "qualifierstournament", "tq", "tournamentqualifiers" ],
    category: "tournaments",
    run,
};
    
export default tournamentQualifiers;