import { Message } from "discord.js";
import osu from "./osu";

interface Command {
    name: string;
    description: string;
    usage: string;

    command: (message: Message, ...args: any[]) => Promise<void>;
}

const commands = new Map<string, Command>();

// List of commands here

// osu! commands (there'll be many more here)
commands.set(osu.name, osu);

export { commands, Command };
