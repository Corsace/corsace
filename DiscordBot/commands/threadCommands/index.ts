import { TournamentChannelType } from "../../../Models/tournaments/tournamentChannel";
import { mappoolQACreate, mappoolQADelete } from "./mapoolQA";
import { jobBoardCreate, jobBoardDelete } from "./jobBoard";
import { ThreadChannel, User } from "discord.js";

type threadCommand = (t: ThreadChannel, u: User) => Promise<void>;

type threadCommands = {
    [key in TournamentChannelType]: { create: threadCommand; delete: threadCommand; } | undefined;
};

export default {
    [TournamentChannelType.Mappoolqa]: { create: mappoolQACreate, delete: mappoolQADelete },
    [TournamentChannelType.Jobboard]: { create: jobBoardCreate, delete: jobBoardDelete },
} as threadCommands;