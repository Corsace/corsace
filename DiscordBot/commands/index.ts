import { ChatInputCommandInteraction, Message, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from "discord.js";

import tournamentCreate from "./tournaments/create";
import tournamentList from "./tournaments/list";

import stageCreate from "./tournaments/stage/create";

import mappoolAssign from "./tournaments/mappool/assign";
import mappoolAssignments from "./tournaments/mappool/assignments";
import mappoolCreate from "./tournaments/mappool/create";
import mappoolDeadline from "./tournaments/mappool/deadline";
import mappoolDownload from "./tournaments/mappool/download";

import avatar from "./utility/avatar";
import help from "./utility/help";

import beatmap from "./osu/beatmap";
import influence from "./osu/influence";
import influenceAdd from "./osu/influenceAdd";
import influenceRemove from "./osu/influenceRemove";
import profile from "./osu/profile";
import recent from "./osu/recent";

interface Command {
    data: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup"> | SlashCommandSubcommandsOnlyBuilder;
    alternativeNames: string[];
    category: string
    subCategory?: string;

    run: (message: Message | ChatInputCommandInteraction, ...args: any[]) => Promise<void>;
}

const commands: Command[] = [];

// List of commands here

// tournament commands
commands.push(tournamentCreate);
commands.push(tournamentList);

// stage commands
commands.push(stageCreate);

// mappool commands
commands.push(mappoolAssign);
commands.push(mappoolAssignments);
commands.push(mappoolCreate);
commands.push(mappoolDeadline);
commands.push(mappoolDownload);

// general utility commands
commands.push(avatar);
commands.push(help);

// osu! commands
commands.push(beatmap);
commands.push(influence);
commands.push(influenceAdd);
commands.push(influenceRemove);
commands.push(profile);
commands.push(recent);

export { commands, Command };