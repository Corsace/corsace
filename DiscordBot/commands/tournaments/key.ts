import { ChatInputCommandInteraction, Message, SlashCommandBuilder } from "discord.js";
import { Command } from "..";
import { extractParameter } from "../../functions/parameterFunctions";
import getTournament from "../../functions/tournamentFunctions/getTournament";
import channelID from "../../functions/channelID";
import respond from "../../functions/respond";
import { createHash, pseudoRandomBytes } from "crypto";
import { securityChecks } from "../../functions/tournamentFunctions/securityChecks";
import { TournamentChannelType, TournamentRoleType } from "../../../Interfaces/tournament";
import { QueryFailedError } from "typeorm";
import { Tournament } from "../../../Models/tournaments/tournament";

async function regenerateKey (tournament: Tournament): Promise<string> {
    const newKey = pseudoRandomBytes(36).toString("hex").toUpperCase();
    const hash = createHash("sha512");
    hash.update(newKey);
    const hashedKey = hash.digest("hex");
    
    tournament.key = hashedKey;
    try {
        await tournament.save();
    } catch (e) {
        if (e instanceof QueryFailedError && (e.driverError.code === "ER_DUP_ENTRY" || e.driverError.errno === 1062))
            return await regenerateKey(tournament);
        else
            throw e;
    }

    return newKey;
}

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    if (!await securityChecks(m, true, true, [TournamentChannelType.Admin], [TournamentRoleType.Organizer]))
        return;

    const tournamentParam = extractParameter(m, { name: "tournament", paramType: "string" }, 1);

    const tournament = await getTournament(m, typeof tournamentParam === "string" ? tournamentParam : channelID(m), typeof tournamentParam === "string" ? "name" : "channel", undefined, true, true);
    if (!tournament)
        return;

    const newKey = await regenerateKey(tournament);

    const message = await respond(m, `**DO NOT SHARE THIS PUBLICLY**.\nThis allows anyone to query tournament data not otherwise publicly available, such as private mappools or qualifier scores.\n\nTo use, add it as a query parameter to the end of the target URL\nExample: \`https://open.corsace.io/stream/qualifierscores?key=${newKey}\`\n\n**Key:** \`${newKey}\`\n\nThis message will be deleted in 1 minute.`);

    setTimeout(async () => await message.delete(), 60000);
}

const data = new SlashCommandBuilder()
    .setName("tournament_key")
    .setDescription("Regenerate a key for external API tournament queries.")
    .addStringOption(option => 
        option.setName("tournament")
            .setDescription("The tournament to regenerate a key for (not required).")
            .setRequired(false));

const tournamentKey: Command = {
    data,
    alternativeNames: [ "key_tournament", "tournament-key", "key-tournament", "tournamentkey", "keytournament", "tkey", "keyt", "t-key", "key-t", "t_key", "key_t", "tournament_k", "k_tournament", "tournament-k", "k-tournament", "tournamentk", "ktournament", "k-t", "t-k", "k_t", "t_k", "tk", "kt" ],
    category: "tournaments",
    run,
};
    
export default tournamentKey;