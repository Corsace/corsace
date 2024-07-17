import { Message, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "..";
import { extractParameter } from "../../functions/parameterFunctions";
import respond from "../../functions/respond";
import { getContentUsageData, contentUsageStatus } from "../../../Server/osu/osuWikiCache";
import { distance } from "fastest-levenshtein";
import { EmbedBuilder } from "../../functions/embedBuilder";
import { extractTargetText } from "../../functions/tournamentFunctions/paramaterExtractionFunctions";

const text = "<https://osu.ppy.sh/wiki/Rules/Content_usage_permissions> Contains information for baseline artist content usage permissions";
const colours: Record<contentUsageStatus, number> = {
    "allowed": 0x00ff00,
    "disallowed": 0xff0000,
    "unknown": 0x000000,
    "allowed with exceptions": 0xffa500,
};

async function run (m: Message | ChatInputCommandInteraction) {
    const artistParam = extractParameter(m, { name: "artist", paramType: "string", customHandler: extractTargetText }, 1);
    if (!artistParam || typeof artistParam !== "string") {
        await respond(m, `Please provide an artist to search for.\n${text}`);
        return;
    }

    const data = await getContentUsageData();
    const artist = data.find(a => distance(a.name.toLowerCase(), artistParam.toLowerCase()) < 3 || a.name.toLowerCase().includes(artistParam.toLowerCase()));
    const embed = new EmbedBuilder();
    if (!artist) {
        embed
            .setTitle(artistParam)
            .setDescription("Artist not found.")
            .setColor(colours.unknown);
        await respond(m, text, embed);
        return;
    }

    embed
        .setTitle(artist.name)
        .setDescription(`${artist.link ? `[osu! Link](${artist.link})\n` : ""}**Status:** ${artist.status}${artist.notes ? `\n**Notes:** ${artist.notes}` : ""}`)
        .setColor(colours[artist.status]);
    await respond(m, text, embed);
}

const data = new SlashCommandBuilder()
    .setName("content_usage")
    .setDescription("Described content usage availability for an artist on osu!")
    .addStringOption(option => 
        option.setName("artist")
            .setDescription("The artist to search for")
            .setRequired(true)
    );

const contentUsage: Command = {
    data,
    alternativeNames: ["contentusage", "content-usage", "usage_content", "usage-content", "cu", "osucontentusage", "osu-content-usage", "osu_artist_content_usage", "osu-artist-content-usage", "ocu", "oacu"],
    category: "osu",
    run,
};

export default contentUsage;