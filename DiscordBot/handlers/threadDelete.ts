import { AuditLogEvent, ThreadChannel } from "discord.js";
import { discordClient } from "../../Server/discord";
import { TournamentChannel } from "../../Models/tournaments/tournamentChannel";
import threadCommands from "../commands/threadCommands";

export default async function threadDelete (t: ThreadChannel) {
    const logs = await t.guild.fetchAuditLogs({ type: AuditLogEvent.ThreadDelete });
    const log = logs.entries.first();
    if (!log || !log.executor || !log.executorId || log.executorId === discordClient.user!.id)
        return;

    if (!t.parentId)
        return;

    const channel = await TournamentChannel.findOne({ where: { channelID: t.parentId } , relations: ["tournament"] });
    if (!channel || !threadCommands[channel.channelType]) 
        return;

    const command = threadCommands[channel.channelType]!;
    await command.delete(t, log.executor);
}