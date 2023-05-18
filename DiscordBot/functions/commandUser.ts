import { ChatInputCommandInteraction, Message } from "discord.js";

export default function commandUser (m: Message | ChatInputCommandInteraction) {
    if (m instanceof Message)
        return m.author;
    else
        return m.user;
}