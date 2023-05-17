import { AuditLogEvent, ThreadChannel } from "discord.js";
import { discordClient } from "../../Server/discord";
import { TournamentChannel, TournamentChannelType } from "../../Models/tournaments/tournamentChannel";
import { User } from "../../Models/user";
import { confirmCommand, fetchMappool, fetchSlot, fetchTournament, mappoolLog } from "../functions/tournamentFunctions";
import { TournamentRole, TournamentRoleType } from "../../Models/tournaments/tournamentRole";

export default async function threadDelete (t: ThreadChannel) {
    const logs = await t.guild.fetchAuditLogs({ type: AuditLogEvent.ThreadDelete });
    const log = logs.entries.first();
    if (!log || !log.executorId || log.executorId === discordClient.user?.id)
        return;

    if (!t.parentId)
        return;

    const channel = await TournamentChannel.findOne({ where: { channelID: t.parentId } });
    if (!channel) 
        return;

    const creator = await User.findOne({ where: { discord: { userID: log.executorId } } });
    if (!creator)
        return;

    const threadName = t.name;

    // Get the pool, slot, and mappers
    const poolRegex = /(\S+) (\S+)( \((.+)\))?/;
    const poolMatch = threadName.match(poolRegex);
    if (!poolMatch)
        return;

    const poolText = poolMatch[1];
    const slotText = poolMatch[2].slice(0, poolMatch[2].length - 1);
    const order = parseInt(poolMatch[2][poolMatch[2].length - 1]);
    if (isNaN(order))
        return;

    const adminChannel = await TournamentChannel.findOne({ where: { tournament: { ID: channel.tournament.ID }, channelType: TournamentChannelType.Admin } });
    if (!adminChannel)
        return;

    const adminDiscordChannel = await discordClient.channels.fetch(adminChannel.channelID);
    if (!adminDiscordChannel || !adminDiscordChannel.isTextBased())
        return;

    const m = await adminDiscordChannel.send("Loading...");

    const tournament = await fetchTournament(m, [], false, false, false, true);
    if (!tournament)
        return;

    const roles = await TournamentRole.find({
        where: {
            tournament: { ID: tournament.ID },
        },
    });
    const targetRoles = [TournamentRoleType.Organizer, TournamentRoleType.Mappoolers];
    const allowedRoles = roles.filter(r => targetRoles.some(t => t === r.roleType));
    if (allowedRoles.length === 0) {
        m.reply(`There are no valid roles for this tournament. Please add ${targetRoles.map(t => t.toString()).join(", ")} roles first.`);
        return;
    }
    const member = await t.guild.members.fetch(log.executorId);
    const allowed = member.roles.cache.hasAny(...allowedRoles.map(r => r.roleID));
    if (!allowed) {
        m.reply("You are not a mappooler or organizer for this tournament.");
        return;
    }

    const mappool = await fetchMappool(m, tournament, poolText);
    if (!mappool)
    return;

    if (mappool.isPublic) {
        m.reply("This mappool is public. You can only create threads for private mappools.");
        return;
    }

    const slot = await fetchSlot(m, mappool, slotText, true);
    if (!slot)
        return;

    const mappoolMap = slot.maps.find(map => map.order === order);
    if (!mappoolMap)
        return;

    if (channel.channelType === TournamentChannelType.Mappoolqa) {
        const confirm = await confirmCommand(m, "Do you want to remove all testplayers, mappers, and the custom beatmap associated with the map now that you deleted its thread?");
        if (!confirm)
            return;

        const customMap = mappoolMap.customBeatmap;
        mappoolMap.customMessageID = mappoolMap.customThreadID = mappoolMap.customBeatmap = null;
        mappoolMap.customMappers = mappoolMap.testplayers = [];
        await mappoolMap.save();
        if (customMap) await customMap.remove();

        await mappoolLog(tournament, "threadDelete", creator, `Deleted thread for ${t.name} and the associated assignments and custom map.`);

        m.reply("Deleted thread and the associated assignments and custom map.");

        return;
    }

    if (channel.channelType === TournamentChannelType.Jobboard) {
        const jobPost = mappoolMap.jobPost;
        if (!jobPost)
            return;

        const confirm = await confirmCommand(m, "Do you want to remove the job board post associated with the map now that you deleted its thread? Selecting no will simply bring it back to its pre-published state.");
        if (confirm) {
            mappoolMap.jobPost = null;
            await mappoolMap.save();
            await jobPost.remove();

            await mappoolLog(tournament, "threadDelete", creator, `Deleted thread for ${t.name} and the associated job board post.`);

            m.reply("Deleted thread and the associated job board post.");

            return;
        }

        jobPost.deadline = jobPost.jobBoardThread = null;
        await jobPost.save();

        await mappoolLog(tournament, "threadDelete", creator, `Deleted thread for ${t.name} and brought the associated job board post to its pre-published state.`);

        m.reply("Deleted thread and brought the associated job board post to its pre-published state.");

        return;
    }
}