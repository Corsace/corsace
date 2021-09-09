import { Message } from "discord.js";
import { discordClient } from "../../Server/discord";
import { commands } from "../commands";
import beatmap from "../commands/osu/beatmap";
import profile from "../commands/osu/profile";
import osuTimestamp from "../commandsInexplicit/osuTimestamp";

export default async function messageCreate (m: Message) {
    const prefix = /^!(\S+)/i;
    const profileRegex = /(osu|old)\.ppy\.sh\/(u|users)\/(\S+)/i;
    const beatmapRegex = /(osu|old)\.ppy\.sh\/(s|b|beatmaps|beatmapsets)\/(\d+)(#(osu|taiko|fruits|mania)\/(\d+))?/i;
    const timestampRegex = /(\d+):(\d{2}):(\d{3})\s*(\(((\d,?)+)\))?/gmi;
    const emojiRegex = /<a?(:.+:)\d+>/i;

    // Don't respond to itself or other bots
    if (m.author.id === discordClient.user?.id || m.author.bot)
        return;

    // Create a version of the message content that has no emojis
    let noEmoji = m.content;
    if (emojiRegex.test(m.content))
        noEmoji = m.content.replaceAll(emojiRegex, "");

    // Check for osu! timeestamps
    if (timestampRegex.test(noEmoji))
        osuTimestamp(m);

    // Command checking TODO: Add custom prefix (relies on discord server model)
    if (prefix.test(m.content)) {
        const commandName = prefix.exec(m.content);
        if (!commandName)
            return;

        const command =  commands.find(cmd => cmd.name.test(commandName[1].toLowerCase()));
        if (!command)
            return;

        await command.command(m);
    }

    // Check for an osu! profile linked
    if (profileRegex.test(m.content))
        profile.command(m);

    // Check for an osu! beatmap linked
    if (beatmapRegex.test(m.content))
        beatmap.command(m);
}