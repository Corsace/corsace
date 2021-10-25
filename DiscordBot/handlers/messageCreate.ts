import { config } from "node-config-ts";
import { Message } from "discord.js";
import { discordClient } from "../../Server/discord";
import { commands } from "../commands";
import beatmap from "../commands/osu/beatmap";
import profile from "../commands/osu/profile";
import mappoolSong from "../commandsInexplicit/mappool/song";
import osuTimestamp from "../commandsInexplicit/osu/osuTimestamp";

export default async function messageCreate (m: Message) {
    const prefix = /^!(\S+)/i;
    const profileRegex = /(osu|old)\.ppy\.sh\/(u|users)\/(\S+)/i;
    const beatmapRegex = /(osu|old)\.ppy\.sh\/(s|b|beatmaps|beatmapsets)\/(\d+)(#(osu|taiko|fruits|mania)\/(\d+))?/i;
    const timestampRegex = /(\d+):(\d{2}):(\d{3})\s*(\(((\d,?)+)\))?/gmi;
    const emojiRegex = /<a?(:.+:)\d+>/gi;

    // Don't respond to itself or other bots
    if (m.author.id === discordClient.user?.id || m.author.bot)
        return;

    // Create a version of the message content that has no emojis
    let noEmoji = m.content;
    if (emojiRegex.test(m.content))
        noEmoji = m.content.replace(emojiRegex, "");

    // Check for osu! timeestamps
    if (timestampRegex.test(noEmoji))
        osuTimestamp(m);

    if (m.channel.id === config.discord.openMappool.songSubmission || m.channel.id === config.discord.closedMappool.songSubmission)
        mappoolSong(m, m.channel.id === config.discord.openMappool.songSubmission);

    // Command checking TODO: Add custom prefix (relies on discord server model)
    if (prefix.test(m.content)) {
        const commandName = prefix.exec(m.content);
        if (!commandName)
            return;
        
        for (const command of commands) { 
            if (!command.name.some(name => name === commandName[1].toLowerCase()))
                continue;
            await command.command(m);
        }
    }

    // Check for an osu! profile linked
    if (profileRegex.test(m.content))
        profile.command(m);

    // Check for an osu! beatmap linked
    if (beatmapRegex.test(m.content))
        beatmap.command(m);
}