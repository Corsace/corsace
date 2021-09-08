import { Message } from "discord.js";
import { discordClient } from "../../Server/discord";
import { commands } from "../commands";

const prefix = /^!(\S+)/;

export default async function messageCreate (m: Message) {
    // Don't respond to itself or other bots
    if (m.author.id === discordClient.user?.id || m.author.bot)
        return;

    // First super basic command
    if (prefix.test(m.content)) {
        const commandName = prefix.exec(m.content);
        if (!commandName)
            return;

        const command =  commands.find(cmd => cmd.name.test(commandName[1].toLowerCase()));
        if (!command)
            return;
        
        await command.command(m);
    }
}