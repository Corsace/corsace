import { Mappool } from "../../../Models/tournaments/mappools/mappool";
import { deletePack } from "../tournamentFunctions/mappackFunctions";
import { CustomBeatmap } from "../../../Models/tournaments/mappools/customBeatmap";
import { JobPost } from "../../../Models/tournaments/mappools/jobPost";
import deleteMappoolMapHistory from "./deleteMappoolMapHistory";
import unlinkMap from "../tournamentFunctions/unlinkMap";
import archiveMapThreads from "../tournamentFunctions/archiveMapThreads";

export default async function deleteMappool (mappool: Mappool) {
    await Promise.all(mappool.slots.flatMap(slot => slot.maps.map(map => archiveMapThreads(map))));

    const customMaps = mappool.slots.flatMap(slot => slot.maps.map(map => map.customBeatmap).filter((customBeatmap): customBeatmap is CustomBeatmap => customBeatmap !== null && customBeatmap !== undefined));
    const jobPosts = mappool.slots.flatMap(slot => slot.maps.map(map => map.jobPost).filter((jobPost): jobPost is JobPost => jobPost !== null && jobPost !== undefined));

    await Promise.all(mappool.slots.flatMap(slot => slot.maps).map(map => unlinkMap(map)));

    await deleteMappoolMapHistory(mappool.slots.flatMap(slot => slot.maps.map(map => map.ID)));
    await Promise.all([...customMaps.map(customBeatmap => customBeatmap.remove()), ...jobPosts.map(jobPost => jobPost.remove())]);

    const maps = mappool.slots.flatMap(slot => slot.maps.map(map => map.remove()));
    await Promise.all(maps);

    const slots = mappool.slots.map(slot => slot.remove());
    await Promise.all(slots);

    await deletePack("mappacksTemp", mappool);
    await mappool.remove();
    return;
}