import { ChatInputCommandInteraction, Message } from "discord.js";
import { extractParameter, separateArgs } from "../parameterFunctions";

export function extractTargetText (m: Message | ChatInputCommandInteraction, index: number) {
    if (m instanceof ChatInputCommandInteraction) {
        if (m.options.getSubcommand(false))
            return m.options.getSubcommand() === "custom" ? m.options.getUser("user")?.id : m.options.getString("link")?.trim();
        if (m.options.getUser("user"))
            return m.options.getUser("user")?.id;
        return m.options.getString("target")?.trim();
    }

    return m.mentions.users.first()?.username ?? separateArgs(m.content).slice(index, separateArgs(m.content).length).join(" ").trim();
}

export function extractDate (m: Message | ChatInputCommandInteraction, index: number) {
    const date = extractParameter(m, { name: "date", paramType: "string" }, index);
    if (typeof date !== "string" )
        return;

    return new Date(date.includes("-") ? date : parseInt(date + "000"));
}