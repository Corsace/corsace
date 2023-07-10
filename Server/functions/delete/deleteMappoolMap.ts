
import { Mappool } from "../../../Models/tournaments/mappools/mappool";
import deleteMappoolMapHistory from "./deleteMappoolMapHistory";
import { MappoolMap } from "../../../Models/tournaments/mappools/mappoolMap";
import archiveMapThreads from "../../../DiscordBot/functions/tournamentFunctions/archiveMapThreads";
import unlinkMap from "../tournaments/mappool/unlinkMap";
import { deletePack } from "../tournaments/mappool/mappackFunctions";

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