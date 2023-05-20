import { ChatInputCommandInteraction, Message } from "discord.js";

export function extractTargetText (m: Message | ChatInputCommandInteraction) {
    if (m instanceof ChatInputCommandInteraction) {
        if (m.options.getSubcommand(false))
            return m.options.getSubcommand() === "custom" ? m.options.getUser("user")?.id : m.options.getString("link");
        return m.options.getString("target");
    }

    return m.mentions.users.first()?.username ?? m.content.split(" ").slice(3, m.content.split(" ").length).join(" ");
}