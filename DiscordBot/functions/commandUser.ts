import { ChatInputCommandInteraction, Message, MessageComponentInteraction } from "discord.js";

export default function commandUser (m: Message | ChatInputCommandInteraction | MessageComponentInteraction) {
    if (m instanceof Message)
        return m.author;
    else
        return m.user;
}