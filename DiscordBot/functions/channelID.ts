import { ChatInputCommandInteraction, Message } from "discord.js";

export default function channelID (m: Message | ChatInputCommandInteraction) {
    if (m.channel?.isThread())
        return m.channel.parentId!;
    else
        return m.channelId;
}