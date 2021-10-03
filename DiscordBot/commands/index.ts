import { Message } from "discord.js";

import avatar from "./utility/avatar";
import mark from "./utility/mark";
import prio from "./utility/prio";
import todo from "./utility/todo";
import todoList from "./utility/todoList";

import beatmap from "./osu/beatmap";
import profile from "./osu/profile";
import recent from "./osu/recent";

interface Command {
    name: string[];
    description: string;
    usage: string;
    category: string

    command: (message: Message, ...args: any[]) => Promise<void>;
}

const commands: Command[] = [];

// List of commands here

// general utility commands
commands.push(avatar);
commands.push(mark);
commands.push(prio);
commands.push(todo);
commands.push(todoList);

// osu! commands
commands.push(beatmap);
commands.push(profile);
commands.push(recent);

export { commands, Command };