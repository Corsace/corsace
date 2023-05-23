import { Message } from "discord.js";
import { discordClient } from "../../Server/discord";
import { commands } from "../commands";
import beatmap from "../commands/osu/beatmap";
import profile from "../commands/osu/profile";
import osuTimestamp from "../commandsInexplicit/osu/osuTimestamp";
import autoSubmit from "../commandsInexplicit/tournaments/mappool/autoSubmit";
import errorHandler from "../functions/error";

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

    // Command checking TODO: Add custom prefix (relies on discord server model)
    let commandRun = false;
    if (prefix.test(m.content)) {
        const commandName = prefix.exec(m.content);
        if (!commandName)
            return;

        for (const command of commands) { 
            if (command.data.name.toLowerCase() !== commandName[1].toLowerCase() && !command.alternativeNames.some(a => a.toLowerCase() === commandName[1].toLowerCase()))
                continue;
            
            commandRun = true;
            m.content = m.content.replace(/\s+/g, " ").trim();
            try {
                await command.run(m);
            } catch (e) {
                errorHandler(e, m);
            }
        }
    }

    // Check for an osu! profile linked
    if (profileRegex.test(m.content) && !commandRun)
        profile.run(m);

    // Check for an osu! beatmap linked
    if (beatmapRegex.test(m.content) && !commandRun)
        beatmap.run(m);

    // Check if a tournament map was uploaded/linked
    if ((m.attachments.first()?.url || /https?:\/\/\S+/.test(m.content)) && !commandRun)
        autoSubmit(m);
}