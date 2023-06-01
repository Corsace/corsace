import { ChatInputCommandInteraction, Message } from "discord.js";
import { Tournament } from "../../../Models/tournaments/tournament";
import { Mappool } from "../../../Models/tournaments/mappools/mappool";
import { User } from "../../../Models/user";
import respond from "../respond";
import { deletePack } from "./mappackFunctions";
import mappoolLog from "./mappoolLog";
import { CustomBeatmap } from "../../../Models/tournaments/mappools/customBeatmap";
import { JobPost } from "../../../Models/tournaments/mappools/jobPost";
import deleteHistory from "./deleteHistory";
import unlinkMap from "./unlinkMap";
import archiveMapThreads from "./archiveMapThreads";

export default async function deleteMappool (m: Message | ChatInputCommandInteraction, tournament: Tournament, mappool: Mappool, user: User) {
    await Promise.all(mappool.slots.flatMap(slot => slot.maps).map(map => unlinkMap(map)));

    await deleteHistory(mappool.slots.flatMap(slot => slot.maps.map(map => map.ID)));

    const maps = mappool.slots.flatMap(slot => slot.maps.map(map => map.remove()));
    await Promise.all(maps);

    const customMaps = mappool.slots.map(slot => slot.maps.map(map => map.customBeatmap).filter((customBeatmap): customBeatmap is CustomBeatmap => customBeatmap !== null && customBeatmap !== undefined).map(customBeatmap => customBeatmap.remove()));
    const jobPosts = mappool.slots.map(slot => slot.maps.map(map => map.jobPost).filter((jobPost): jobPost is JobPost => jobPost !== null && jobPost !== undefined).map(jobPost => jobPost.remove()));
    const threadArchiving = mappool.slots.flatMap(slot => slot.maps.map(map => archiveMapThreads(map)));
    await Promise.all([...customMaps, ...jobPosts, ...threadArchiving]);

    const slots = mappool.slots.map(slot => slot.remove());
    await Promise.all(slots);

    await deletePack("mappacksTemp", mappool);
    await mappool.remove();

    await Promise.all([
        respond(m, `**${mappool.name.toUpperCase()} (${mappool.abbreviation.toUpperCase()})** has been deleted`),
        mappoolLog(tournament, "delete", user, `\`${mappool.name.toUpperCase()} (${mappool.abbreviation.toUpperCase()})\` has been deleted`),
    ]);
    return;
}