import { DiscordAPIError, ThreadChannel } from "discord.js";
import { TournamentRoleType } from "../../../Models/tournaments/tournamentRole";
import { discordClient } from "../../../Server/discord";
import { User } from "../../../Models/user";
import getStaff from "../../functions/tournamentFunctions/getStaff";
import mappoolLog from "../../functions/tournamentFunctions/mappoolLog";
import confirmCommand from "../../functions/confirmCommand";
import { mappoolComponentsThreadType } from "../../functions/tournamentFunctions/mappoolComponentsThread";
import respond from "../../functions/respond";

export async function mappoolQACreate (t: ThreadChannel, { m, creator, tournament, mappoolMap, mappers }: mappoolComponentsThreadType) {
    const mapperUsers: User[] = [];
    for (const mapper of mappers) {
        const user = await getStaff(m, tournament, mapper, [TournamentRoleType.Mappers, TournamentRoleType.Mappoolers, TournamentRoleType.Organizer]);
        if (!user)
            return;

        mapperUsers.push(user);
    }

    // Check if custom mappers array is the same as mapperUsers
    if ((mappoolMap.customMappers.length !== mapperUsers.length || mappoolMap.customMappers.some(u => !mapperUsers.some(u2 => u2.discord.userID === u.discord.userID))) && !await confirmCommand(m, `The mappers in the thread name do not match the mappers in the map. Do you want to overwrite the mappers in the map with the mappers in the thread name?\n\nThread mappers: ${mapperUsers.map(u => u.osu.username).join(", ")}\nMap mappers: ${mappoolMap.customMappers.map(u => u.osu.username).join(", ")}`, false)) {
        return;
    }
    mappoolMap.assignedBy = creator;
    mappoolMap.customMappers = mapperUsers;
    
    if (mappoolMap.customThreadID) {
        const confirm = await confirmCommand(m, "This map already has a thread. Do you want to create a new one?", false);
        if (!confirm)
            return;

        try {
            const thread = await discordClient.channels.fetch(mappoolMap.customThreadID) as ThreadChannel | null;
            if (thread) {
                await thread.setAppliedTags([], "This thread has been remade.");
                await thread.setArchived(true, "This thread has been remade.");
            }
        } catch (e) {
            if (!(e instanceof DiscordAPIError) || e.code !== 10003) 
                throw e;
        }

    }
    mappoolMap.customThreadID = t.id;

    const content = `Map: **${mappoolMap.customBeatmap ? `${mappoolMap.customBeatmap.artist} - ${mappoolMap.customBeatmap.title} [${mappoolMap.customBeatmap.difficulty}]` : "N/A"}**\nMapper(s): **${mappoolMap.customMappers.length > 0 ? mappoolMap.customMappers.map(u => `<@${u.discord.userID}>`).join(" ") : "N/A"}**\nTestplayer(s): **${mappoolMap.testplayers.length > 0 ? mappoolMap.testplayers.map(u => `<@${u.discord.userID}>`).join(" ") : "N/A"}**\nDeadline: ${mappoolMap.deadline ? `<t:${mappoolMap.deadline.getTime() / 1000}:F> (<t:${mappoolMap.deadline.getTime() / 1000}:R>)` : "**N/A**"}`;
    const threadMsg = await t.send(content);
    mappoolMap.customMessageID = threadMsg.id;
    
    await mappoolMap.save();

    await mappoolLog(tournament, "threadCreate", creator, `Created QA thread for \`${t.name}\` <#${t.id}>`);
    return;
}

export async function mappoolQADelete (t: ThreadChannel, { m, creator, tournament, mappoolMap }: mappoolComponentsThreadType) {
    const confirm = await confirmCommand(m, `<@${creator.discord.userID}> Do you want to remove all testplayers, mappers, and the custom beatmap associated with the map now that you deleted its thread for **${t.name}**?`, false);
    if (!confirm)
        return;

    const customMap = mappoolMap.customBeatmap;
    mappoolMap.customMessageID = mappoolMap.customThreadID = mappoolMap.customBeatmap = null;
    mappoolMap.customMappers = mappoolMap.testplayers = [];
    await mappoolMap.save();
    if (customMap) await customMap.remove();

    await respond(m, `Deleted thread for **${t.name}** and the associated assignments and custom map.`);

    await mappoolLog(tournament, "threadDelete", creator, `Deleted thread for \`${t.name}\` and the associated assignments and custom map`);

    return;
}