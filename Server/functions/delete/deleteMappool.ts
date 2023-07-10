import archiveMapThreads from "../../../DiscordBot/functions/tournamentFunctions/archiveMapThreads";
import { deletePack } from "../tournaments/mappool/mappackFunctions";
import { CustomBeatmap } from "../../../Models/tournaments/mappools/customBeatmap";
import { JobPost } from "../../../Models/tournaments/mappools/jobPost";
import { Mappool } from "../../../Models/tournaments/mappools/mappool";
import unlinkMap from "../tournaments/mappool/unlinkMap";
import deleteMappoolMapHistory from "./deleteMappoolMapHistory";

export default async function deleteMappool (mappool: Mappool) {
    await Promise.all(mappool.slots.flatMap(slot => slot.maps.map(map => archiveMapThreads(map))));

    const customMaps = mappool.slots.flatMap(slot => slot.maps.map(map => map.customBeatmap).filter((customBeatmap): customBeatmap is CustomBeatmap => customBeatmap !== null && customBeatmap !== undefined));
    const jobPosts = mappool.slots.flatMap(slot => slot.maps.map(map => map.jobPost).filter((jobPost): jobPost is JobPost => jobPost !== null && jobPost !== undefined));

    await Promise.all(mappool.slots.flatMap(slot => slot.maps).map(map => unlinkMap(map)));

    await deleteMappoolMapHistory(mappool.slots.flatMap(slot => slot.maps.map(map => map.ID)));
    await Promise.all([...customMaps.map(customBeatmap => customBeatmap.remove()), ...jobPosts.map(jobPost => jobPost.remove())]);

    await Promise.all(mappool.slots.flatMap(slot => slot.maps.map(map => map.remove())));

    await Promise.all(mappool.slots.map(slot => slot.remove()));

    await deletePack("mappacksTemp", mappool);
    await mappool.remove();
    return;
}