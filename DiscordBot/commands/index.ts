import { ChatInputCommandInteraction, Message, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder, ThreadChannel } from "discord.js";

import tournamentChannel from "./tournaments/channel";
import tournamentCreate from "./tournaments/create";
import tournamentEdit from "./tournaments/edit";
import tournamentInfo from "./tournaments/info";
import tournamentKey from "./tournaments/key";
import tournamentList from "./tournaments/list";
import tournamentRole from "./tournaments/role";
import tournamentScreening from "./tournaments/screening";
import tournamentTeams from "./tournaments/teams";

import mappoolAdd from "./tournaments/mappool/add";
import mappoolAssign from "./tournaments/mappool/assign";
import mappoolAssignments from "./tournaments/mappool/assignments";
import mappoolCreate from "./tournaments/mappool/create";
import mappoolDeadline from "./tournaments/mappool/deadline";
import mappoolDelete from "./tournaments/mappool/delete";
import mappoolDownload from "./tournaments/mappool/download";
import mappoolEdit from "./tournaments/mappool/edit";
import mappoolFinish from "./tournaments/mappool/finish";
import mappoolHistory from "./tournaments/mappool/history";
import mappoolInfo from "./tournaments/mappool/info";
import mappoolPublish from "./tournaments/mappool/publish";
import mappoolRemove from "./tournaments/mappool/remove";
import mappoolReplay from "./tournaments/mappool/replay";
import mappoolSubmit from "./tournaments/mappool/submit";
import mappoolSwap from "./tournaments/mappool/swap";

import jobDelete from "./tournaments/mappool/jobBoard/delete";
import job from "./tournaments/mappool/jobBoard/job";
import jobInfo from "./tournaments/mappool/jobBoard/info";
import jobPublish from "./tournaments/mappool/jobBoard/publish";

import stageCreate from "./tournaments/stage/create";
import stageDelete from "./tournaments/stage/delete";
import stageEdit from "./tournaments/stage/edit";
import stageInfo from "./tournaments/stage/info";
import stageOrder from "./tournaments/stage/order";
import stageScores from "./tournaments/stage/scores";

import teamAvatar from "./tournaments/team/avatar";
import teamInvite from "./tournaments/team/invite";
import teamList from "./tournaments/team/list";
import teamQualifier from "./tournaments/team/qualifier";

import inviteAccept from "./tournaments/team/invite/accept";
import inviteDecline from "./tournaments/team/invite/decline";
import inviteList from "./tournaments/team/invite/list";

import matchupList from "./tournaments/matchup/list";
import matchupReschedule from "./tournaments/matchup/reschedule";
import matchupScores from "./tournaments/matchup/scores";
import matchupStaff from "./tournaments/matchup/staff";
import matchupStopAutoLobby from "./tournaments/matchup/stopAutoLobby";

import avatar from "./utility/avatar";
import help from "./utility/help";
import ping from "./utility/ping";

import beatmap from "./osu/beatmap";
import influence from "./osu/influence";
import influenceAdd from "./osu/influenceAdd";
import influenceRemove from "./osu/influenceRemove";
import profile from "./osu/profile";
import recent from "./osu/recent";

import { mappoolQACreate, mappoolQADelete } from "../commandsInexplicit/threadCommands/mapoolQA";
import { jobBoardCreate, jobBoardDelete } from "../commandsInexplicit/threadCommands/jobBoard";
import { mappoolComponentsThreadType } from "../functions/tournamentFunctions/mappoolComponentsThread";
import { TournamentChannelType } from "../../Interfaces/tournament";

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
commands.push(tournamentChannel);
commands.push(tournamentCreate);
commands.push(tournamentEdit);
commands.push(tournamentInfo);
commands.push(tournamentKey);
commands.push(tournamentList);
commands.push(tournamentRole);
commands.push(tournamentScreening);
commands.push(tournamentTeams);

// mappool commands
commands.push(mappoolAdd);
commands.push(mappoolAssign);
commands.push(mappoolAssignments);
commands.push(mappoolCreate);
commands.push(mappoolDeadline);
commands.push(mappoolDelete);
commands.push(mappoolDownload);
commands.push(mappoolEdit);
commands.push(mappoolFinish);
commands.push(mappoolHistory);
commands.push(mappoolInfo);
commands.push(mappoolPublish);
commands.push(mappoolRemove);
commands.push(mappoolReplay);
commands.push(mappoolSubmit);
commands.push(mappoolSwap);

// job board commands
commands.push(job);
commands.push(jobDelete);
commands.push(jobInfo);
commands.push(jobPublish);

// stage commands
commands.push(stageCreate);
commands.push(stageDelete);
commands.push(stageEdit);
commands.push(stageInfo);
commands.push(stageOrder);
commands.push(stageScores);

// team commands
commands.push(teamAvatar);
commands.push(teamInvite);
commands.push(teamList);
commands.push(teamQualifier);

// invite commands
commands.push(inviteAccept);
commands.push(inviteDecline);
commands.push(inviteList);

// matchup commands
commands.push(matchupList);
commands.push(matchupReschedule);
commands.push(matchupScores);
commands.push(matchupStaff);
commands.push(matchupStopAutoLobby);

// general utility commands
commands.push(avatar);
commands.push(help);
commands.push(ping);

// osu! commands
commands.push(beatmap);
commands.push(influence);
commands.push(influenceAdd);
commands.push(influenceRemove);
commands.push(profile);
commands.push(recent);

type threadCommand = (t: ThreadChannel, components: mappoolComponentsThreadType) => Promise<void>;

type threadCommands = {
    [key in TournamentChannelType]: { create: threadCommand; delete: threadCommand; } | undefined;
};

const threadCommands = {
    [TournamentChannelType.Mappoolqa]: { create: mappoolQACreate, delete: mappoolQADelete },
    [TournamentChannelType.Jobboard]: { create: jobBoardCreate, delete: jobBoardDelete },
} as threadCommands;

export { commands, Command, threadCommands };