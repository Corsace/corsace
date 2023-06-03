import { ForumChannel, ThreadChannel } from "discord.js";
import { MappoolMap } from "../../../Models/tournaments/mappools/mappoolMap";
import { discordClient } from "../../../Server/discord";

export default async function archiveMapThreads (map: MappoolMap) {
    return Promise.all([archiveCustomThread(map), archiveJobThread(map)]);
}

export async function archiveCustomThread (map: MappoolMap) {
    if (map.customThreadID) {
        const ch = await discordClient.channels.fetch(map.customThreadID) as ThreadChannel | null;
        if (ch)
            await ch.setArchived(true);
    }
}

export async function archiveJobThread (map: MappoolMap) {
    if (map.jobPost?.jobBoardThread) {
        const ch = await discordClient.channels.fetch(map.jobPost.jobBoardThread) as ThreadChannel | null;
        if (ch) {
            const forum = ch.parent as ForumChannel;
            await ch.setAppliedTags([ forum.availableTags.find(tag => tag.name.toLowerCase() === "closed")?.id || "" ]);
            await ch.setArchived(true);
        }
    }
}