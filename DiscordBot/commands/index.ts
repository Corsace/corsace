import { Message } from "discord.js";
import avatar from "./utility/avatar";
import beatmap from "./osu/beatmap";
import profile from "./osu/profile";
import recent from "./osu/recent";

interface Command {
    name: string[];
    description: string;
    usage: string;

    command: (message: Message, ...args: any[]) => Promise<void>;
}

const commands: Command[] = [];

// List of commands here

// general utility commands
commands.push(avatar);

// osu! commands
commands.push(beatmap);
commands.push(profile);
commands.push(recent);

export { commands, Command };