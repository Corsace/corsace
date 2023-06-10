import { AuditLogEvent, ThreadChannel } from "discord.js";
import { discordClient } from "../../Server/discord";
import { TournamentChannel } from "../../Models/tournaments/tournamentChannel";
import { threadCommands } from "../commands";
import mappoolComponentsThread from "../functions/tournamentFunctions/mappoolComponentsThread";
import { threadNameRegex } from "../functions/tournamentFunctions/getCustomThread";

export default async function threadUpdate (ot: ThreadChannel, nt: ThreadChannel) {
    // Don't need to check thread updates for anything else (currently)
    if (ot.name === nt.name)
        return;

    const logs = await nt.guild.fetchAuditLogs({ type: AuditLogEvent.ThreadUpdate });
    const log = logs.entries.first();
    if (!log || !log.executor || !log.executorId || log.executorId === discordClient.user!.id)
        return;

    if (!nt.parentId)
        return;

    const channel = await TournamentChannel.findOne({ where: { channelID: nt.parentId } });
    if (!channel || !threadCommands[channel.channelType]) 
        return;

    const [newComponents, oldComponents] = await Promise.all([ 
        mappoolComponentsThread(nt, log.executor),
        mappoolComponentsThread(ot, log.executor),
    ]);
    if (!newComponents || !oldComponents)
        return;

    const command = threadCommands[channel.channelType]!;


    // Get the pool, slot, and mappers
    const oldThreadName = ot.name;
    const newThreadName = nt.name;

    const poolMatchOld = oldThreadName.match(threadNameRegex)!;
    const poolMatchNew = newThreadName.match(threadNameRegex);
    if (!poolMatchNew) {
        await Promise.all([
            nt.send("Invalid thread name"),
            nt.setName(oldThreadName),
        ]);
        return;
    }
    if (!poolMatchOld) {
        oldComponents.m.delete();
        await command.create(nt, newComponents);
        await newComponents.m.delete();
        return;
    }

    await Promise.all([
        command.create(nt, newComponents),
        command.delete(ot, oldComponents),
    ]);

    await Promise.all([
        oldComponents.m.delete(),
        newComponents.m.delete(),
    ]);
}