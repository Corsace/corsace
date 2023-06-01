import { ChatInputCommandInteraction, Message } from "discord.js";
import { Tournament } from "../../../Models/tournaments/tournament";
import { Mappool } from "../../../Models/tournaments/mappools/mappool";
import { User } from "../../../Models/user";
import respond from "../respond";
import { deletePack } from "./mappackFunctions";
import mappoolLog from "./mappoolLog";
import deleteHistory from "./deleteHistory";
import unlinkMap from "./unlinkMap";
import archiveMapThreads from "./archiveMapThreads";
import { MappoolMap } from "../../../Models/tournaments/mappools/mappoolMap";

export default async function deleteMappoolMap (m: Message | ChatInputCommandInteraction, tournament: Tournament, mappool: Mappool, user: User, mappoolMap: MappoolMap, mappoolSlot: string) {
    const hasCustom = mappoolMap.customBeatmap ? true : false;
    const hasJobPost = mappoolMap.jobPost ? true : false;

    await unlinkMap(mappoolMap);

    await deleteHistory([mappoolMap.ID]);

    await mappoolMap.remove();

    await Promise.all([
        mappoolMap.customBeatmap?.remove(),
        mappoolMap.jobPost?.remove(),
        archiveMapThreads(mappoolMap),
    ]);

    await Promise.all([
        deletePack("mappacksTemp", mappool),
        respond(m, `**${mappoolSlot}** has been deleted ${hasCustom || hasJobPost ? "along with the custom beatmap and/or job posts" : ""}`),
        mappoolLog(tournament, "delete", user, `\`${mappoolSlot}\` has been deleted ${hasCustom || hasJobPost ? "along with the custom beatmap and/or job posts" : ""}`),
    ]);
    return;
}