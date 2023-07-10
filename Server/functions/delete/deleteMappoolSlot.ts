import { Mappool } from "../../../Models/tournaments/mappools/mappool";
import { CustomBeatmap } from "../../../Models/tournaments/mappools/customBeatmap";
import { JobPost } from "../../../Models/tournaments/mappools/jobPost";
import deleteMappoolMapHistory from "./deleteMappoolMapHistory";
import { MappoolSlot } from "../../../Models/tournaments/mappools/mappoolSlot";
import archiveMapThreads from "../../../DiscordBot/functions/tournamentFunctions/archiveMapThreads";
import unlinkMap from "../tournaments/mappool/unlinkMap";
import { deletePack } from "../tournaments/mappool/mappackFunctions";

export default async function deleteMappoolSlot (mappool: Mappool, slotMod: MappoolSlot) {
    await Promise.all(slotMod.maps.map(map => archiveMapThreads(map)));

    const customMaps = slotMod.maps.map(map => map.customBeatmap).filter((customBeatmap): customBeatmap is CustomBeatmap => customBeatmap !== null && customBeatmap !== undefined);
    const jobPosts = slotMod.maps.map(map => map.jobPost).filter((jobPost): jobPost is JobPost => jobPost !== null && jobPost !== undefined);

    await Promise.all(slotMod.maps.map(map => unlinkMap(map)));

    await deleteMappoolMapHistory(slotMod.maps.map(map => map.ID));
    await Promise.all([...customMaps.map(customBeatmap => customBeatmap.remove()), ...jobPosts.map(jobPost => jobPost.remove()) ]);

    await Promise.all(slotMod.maps.map(map => map.remove()));

    await slotMod.remove();

    await deletePack("mappacksTemp", mappool);
    return;
}