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

    if (m.mentions.users.first()?.username)
        return m.mentions.users.first()?.username;

    const args = separateArgs(m.content);

    // See if every argument from index to the end has a - in front of it. If it does, then only the first argument is the target. If not, then filter out all arguments that have a - in front of them, and join the rest.
    if (args.slice(index, args.length).every(arg => arg.startsWith("-")))
        return args[index];
    return args.slice(index, args.length).filter(arg => !arg.startsWith("-")).join(" ").trim();
}

export function extractDate (m: Message | ChatInputCommandInteraction, index: number) {
    const date = extractParameter(m, { name: "date", paramType: "string" }, index);
    if (typeof date !== "string" )
        return;

    return new Date(date.includes("-") ? date : parseInt(date + "000"));
}