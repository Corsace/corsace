import { Message } from "discord.js";
import { discordClient } from "../../Server/discord";
import { commands } from "../commands";

const prefix = /^!(\S+)/;

export default async function messageCreate (message: Message) {
    // Don't respond to itself or other bots
    if (message.author.id === discordClient.user?.id || message.author.bot)
        return;

    // First super basic command
    if (prefix.test(message.content)) {
        const commandName = prefix.exec(message.content);
        if (!commandName)
            return;

        const command = commands.get(commandName[1].toLowerCase());
        if (!command)
            return;

        await command.command(message);
    }
}