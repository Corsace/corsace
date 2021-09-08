import { Message } from "discord.js";
import avatar from "./utility/avatar";
import osu from "./osu";

interface Command {
    name: RegExp;
    description: string;
    usage: string;

    command: (message: Message, ...args: any[]) => Promise<void>;
}

const commands: Command[] = [];

// List of commands here

// general utility commands
commands.push(avatar);

// osu! commands
commands.push(osu);

export { commands, Command };