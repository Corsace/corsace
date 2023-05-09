import { ForumChannel, ThreadChannel } from "discord.js";
import { discordClient } from "../../discord";
import { MappoolMap } from "../../../Models/tournaments/mappools/mappoolMap";
import { Tournament } from "../../../Models/tournaments/tournament";
import { mappoolLog } from "../../../DiscordBot/functions/tournamentFunctions";

export default async function execute () {
    // Get all mappoolMaps where their deadline has passed.
    const maps = await MappoolMap
        .createQueryBuilder("map")
        .where("map.deadline <= :date", { date: new Date() })
        .getMany();

    // For each job, add the Late tag to QA their respective QA thread, and remove the deadline from the database.
    const tournaments: Tournament[] = [];
    for (const map of maps) {
        if (map.customThreadID) {
            const thread = await discordClient.channels.fetch(map.customThreadID) as ThreadChannel | null;
            if (thread) {
                const forumChannel = thread.parent as ForumChannel;
                const tag = forumChannel.availableTags.find(t => t.name.toLowerCase() === "late")?.id;
                if (tag) await thread.setAppliedTags([...thread.appliedTags, tag], "The deadline for this beatmap has now passed.");

                const tournament = tournaments.find(t => t.server === thread.guildId) || await Tournament
                    .createQueryBuilder("tournament")
                    .leftJoinAndSelect("tournament.organizer", "organizer")
                    .leftJoinAndSelect("tournament.mode", "mode")
                    .where("tournament.server = :server", { server: thread.guildId })
                    .getOne();

                if (tournament)
                    mappoolLog(tournament, "customMapCron", tournament.organizer, `Applied the \`late\` tag for **${thread.name}** <#${thread.id}>.`);
            }
        }

        map.deadline = null;
        await map.save();
    }
}