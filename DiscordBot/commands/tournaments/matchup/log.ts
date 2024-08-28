import { Message, SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../../index";
import { extractParameters } from "../../../functions/parameterFunctions";
import respond from "../../../functions/respond";
import getTournament from "../../../functions/tournamentFunctions/getTournament";
import channelID from "../../../functions/channelID";
import { MatchupMessage } from "../../../../Models/tournaments/matchupMessage";

const dateTimeFormats = ["ISO", "YYYY-MM-DD HH:mm:ss", "HH:mm:ss", "HH:mm", "Long"] as const;
const dateFunctions: Record<typeof dateTimeFormats[number], (date: Date) => string> = {
    ISO: (date: Date) => date.toISOString(),
    "YYYY-MM-DD HH:mm:ss": (date: Date) => date.toLocaleString("en-US", { timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    "HH:mm:ss": (date: Date) => date.toLocaleString("en-US", { timeZone: "UTC", hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    "HH:mm": (date: Date) => date.toLocaleString("en-US", { timeZone: "UTC", hour: "2-digit", minute: "2-digit" }),
    Long: (date: Date) => date.toLocaleString("en-US", { timeZone: "UTC", dateStyle: "full", timeStyle: "full" }),
};

async function run (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction)
        await m.deferReply();

    const params = await extractParameters<parameters>(m, [
        { name: "matchup", paramType: "string" },
        { name: "tournament", paramType: "string", optional: true },
        { name: "date_format", paramType: "string", optional: true },
    ]);
    if (!params)
        return;

    const { matchup: matchupID, tournament: tournamentParam, date_format } = params;

    const tournament = await getTournament(m, typeof tournamentParam === "string" ? tournamentParam : channelID(m), typeof tournamentParam === "string" ? "name" : "channel", undefined, true);
    if (!tournament)
        return;

    const messages = await MatchupMessage
        .createQueryBuilder("message")
        .innerJoin("message.matchup", "matchup")
        .innerJoin("matchup.stage", "stage")
        .innerJoin("stage.tournament", "tournament")
        .innerJoinAndSelect("message.user", "user")
        .where("(matchup.ID = :matchupID OR matchup.matchID = :matchupID)", { matchupID })
        .andWhere("tournament.ID = :tournamentID", { tournamentID: tournament.ID })
        .getMany();
    if (messages.length === 0) {
        await respond(m, `Matchup ID \`${matchupID}\` has no messages in tournament \`${tournament.name}\``);
        return;
    }

    const messagesString = messages.map(message => {
        const date = message.timestamp;
        const dateFormatted = dateFunctions[date_format ?? "ISO"](date);   
        return `[${dateFormatted}][${message.user.osu.username}] ${message.content}`;
    }).join("\n");

    const message = `Chat log for matchup ID \`${matchupID}\` in tournament \`${tournament.name}\``;
    await respond(m, message, undefined, undefined, [{ name: "matchup_log.md", attachment: Buffer.from(messagesString) }]);
}

const data = new SlashCommandBuilder()
    .setName("matchup_log")
    .setDescription("Get chat log for a matchup")
    .addStringOption(option => 
        option.setName("matchup")
            .setDescription("The ID of the matchup to grab the chat log for")
            .setRequired(true))
    .addStringOption(option => 
        option.setName("tournament")
            .setDescription("The tournament to search the matchup in")
            .setRequired(false))
    .addStringOption(option =>
        option.setName("date_format")
            .setDescription("The format to display the date in")
            .setRequired(false)
            .addChoices(
                { name: "ISO", value: "ISO" },
                { name: "YYYY-MM-DD HH:mm:ss", value: "YYYY-MM-DD HH:mm:ss" },
                { name: "HH:mm:ss", value: "HH:mm:ss" },
                { name: "HH:mm", value: "HH:mm" },
                { name: "Long", value: "Long" }
            )
    )
    .setDMPermission(false);

interface parameters {
    matchup: string,
    tournament?: string,
    date_format?: typeof dateTimeFormats[number],
}

const matchupLog: Command = {
    data,
    alternativeNames: [ "log_matchup", "log-matchup", "matchup-log", "matchuplog", "logmatchup", "logm", "mlog" ],
    category: "tournaments",
    subCategory: "matchups",
    run,
};

export default matchupLog;
