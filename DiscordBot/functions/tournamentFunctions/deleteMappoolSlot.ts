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
import { MappoolSlot } from "../../../Models/tournaments/mappools/mappoolSlot";

export default async function deleteMappoolSlot (m: Message | ChatInputCommandInteraction, tournament: Tournament, mappool: Mappool, user: User, slotMod: MappoolSlot) {
    await Promise.all(slotMod.maps.map(map => unlinkMap(map)));

    await deleteHistory(slotMod.maps.map(map => map.ID));

    const maps = slotMod.maps.map(map => map.remove());
    await Promise.all(maps);

    const customMaps = slotMod.maps.map(map => map.customBeatmap).filter((customBeatmap): customBeatmap is CustomBeatmap => customBeatmap !== null && customBeatmap !== undefined).map(customBeatmap => customBeatmap.remove());
    const jobPosts = slotMod.maps.map(map => map.jobPost).filter((jobPost): jobPost is JobPost => jobPost !== null && jobPost !== undefined).map(jobPost => jobPost.remove());
    await Promise.all([...customMaps, ...jobPosts, slotMod.maps.map(map => archiveMapThreads(map))]);

    await slotMod.remove();

    await Promise.all([
        deletePack("mappacksTemp", mappool),
        respond(m, `**${slotMod.name.toUpperCase()} (${slotMod.acronym.toUpperCase()})** in **${mappool.name.toUpperCase()} (${mappool.abbreviation.toUpperCase()})** has been deleted`),
        mappoolLog(tournament, "delete", user, `\`${slotMod.name.toUpperCase()} (${slotMod.acronym.toUpperCase()})\` in \`${mappool.name.toUpperCase()} (${mappool.abbreviation.toUpperCase()})\` has been deleted`),
    ]);
    return;
}