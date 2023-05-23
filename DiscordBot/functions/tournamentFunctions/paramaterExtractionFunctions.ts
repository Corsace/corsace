import { ChatInputCommandInteraction, Message } from "discord.js";
import { extractParameter } from "../parameterFunctions";

export function extractTargetText (index: number) {
    return function (m: Message | ChatInputCommandInteraction) {
        if (m instanceof ChatInputCommandInteraction) {
            if (m.options.getSubcommand(false))
                return m.options.getSubcommand() === "custom" ? m.options.getUser("user")?.id : m.options.getString("link");
            if (m.options.getUser("user"))
                return m.options.getUser("user")?.id;
            return m.options.getString("target");
        }

        return m.mentions.users.first()?.username ?? m.content.split(" ").slice(index, m.content.split(" ").length).join(" ");
    }
}

export function extractDate (index: number) {
    return function (m: Message | ChatInputCommandInteraction) {
        const date = extractParameter(m, { name: "date", regex: /-d ((?:\d{4}-\d{2}-\d{2})|\d{10})/, regexIndex: 1, paramType: "string" }, index);
        if (typeof date !== "string" )
            return;

        return new Date(date.includes("-") ? date : parseInt(date + "000"));
    }
}