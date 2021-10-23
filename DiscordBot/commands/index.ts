import { Message } from "discord.js";

import mappoolAssign from "./mappool/assign";
import mappoolAssignments from "./mappool/assignments";
import mappoolDeadline from "./mappool/deadline";
import mappoolDownload from "./mappool/download";
import mappoolInfo from "./mappool/info";
import mappoolRemove from "./mappool/remove";
import mappoolSubmit from "./mappool/submit";
import mappoolSwap from "./mappool/swap";

import avatar from "./utility/avatar";
import help from "./utility/help";
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

// mappool commands
commands.push(mappoolAssign);
commands.push(mappoolAssignments);
commands.push(mappoolDeadline);
commands.push(mappoolDownload);
commands.push(mappoolInfo);
commands.push(mappoolRemove);
commands.push(mappoolSubmit);
commands.push(mappoolSwap);

// general utility commands
commands.push(avatar);
commands.push(help);
commands.push(mark);
commands.push(prio);
commands.push(todo);
commands.push(todoList);

// osu! commands
commands.push(beatmap);
commands.push(profile);
commands.push(recent);

export { commands, Command };