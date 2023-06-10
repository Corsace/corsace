
import { Mappool } from "../../../Models/tournaments/mappools/mappool";
import { deletePack } from "../tournamentFunctions/mappackFunctions";
import deleteMappoolMapHistory from "./deleteMappoolMapHistory";
import unlinkMap from "../tournamentFunctions/unlinkMap";
import archiveMapThreads from "../tournamentFunctions/archiveMapThreads";
import { MappoolMap } from "../../../Models/tournaments/mappools/mappoolMap";

export default async function deleteMappoolMap (mappool: Mappool, mappoolMap: MappoolMap) {
    await archiveMapThreads(mappoolMap);

    const customBeatmap = mappoolMap.customBeatmap;
    const jobPost = mappoolMap.jobPost;

    await unlinkMap(mappoolMap);

    await deleteMappoolMapHistory([mappoolMap.ID]);

    await Promise.all([
        customBeatmap?.remove(),
        jobPost?.remove(),
    ]);

    await mappoolMap.remove();

    await deletePack("mappacksTemp", mappool);
    return;
}