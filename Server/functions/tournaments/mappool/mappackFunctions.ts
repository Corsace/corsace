import { ChatInputCommandInteraction, Message } from "discord.js";
import { Mappool } from "../../../../Models/tournaments/mappools/mappool";
import { randomUUID } from "crypto";
import { gets3Key } from "../../../utils/s3";
import { buckets } from "../../../s3";
import { download } from "../../../utils/download";
import { zipFiles } from "../../../utils/zip";
import { MappoolMap } from "../../../../Models/tournaments/mappools/mappoolMap";
import { insertBeatmap } from "../../../scripts/fetchYearMaps";
import { osuClient } from "../../../osu";
import { Beatmap as APIBeatmap } from "nodesu";
import respond from "../../../../DiscordBot/functions/respond";
import { getLink } from "../../../../DiscordBot/functions/getLink";
import { Readable } from "stream";
import { BeatmapsetRankedStatus } from "../../../../Models/beatmapset";
import { cleanLink } from "../../../utils/link";

export async function createPack (m: Message | ChatInputCommandInteraction, bucket: "mappacks" | "mappacksTemp", mappool: Mappool, packName: string, video = false): Promise<string | undefined> {
    const mappoolMaps = mappool.slots.flatMap(s => s.maps);
    if (bucket === "mappacks" && mappoolMaps.some(poolMap => !poolMap.beatmap)) {
        const slots = mappool.slots.filter(s => s.maps.some(slotMap => !slotMap.beatmap));
        const maps = slots
            .flatMap(s => s.maps.filter(slotMap => !slotMap.beatmap))
            .map(map => `${slots.find(slot => slot.maps.some(slotMap => slotMap.ID === map.ID))!.acronym.toUpperCase()}${map.order}`);
        await respond(m, `**${mappool.name}** doesnt have all finished beatmaps yet, which are ${maps.join(", ")}, remember to run !pfinish or /mappool_finish for them`);
        return;
    }
    const filteredMaps = mappoolMaps.filter(mappoolMap => (mappoolMap.customBeatmap?.link) ?? mappoolMap.beatmap);
    if (filteredMaps.length === 0) {
        await respond(m, `**${mappool.name}** doesn't have any downloadable beatmaps`);
        return;
    }
    const updatedMaps: MappoolMap[] = [];
    for (const map of filteredMaps) {
        let beatmap = map.beatmap;
        if (beatmap && beatmap.beatmapset.rankedStatus <= BeatmapsetRankedStatus.Pending) {
            const set = await osuClient.beatmaps.getByBeatmapId(beatmap.ID) as APIBeatmap[];
            const apiMap = set.find(setMap => setMap.beatmapId === beatmap!.ID);
            if (!apiMap) {
                await respond(m, "Can't find the beatmap via osu!api");
                return;
            }
            beatmap = await insertBeatmap(apiMap);
            map.beatmap = beatmap;
            await map.save();
        }

        updatedMaps.push(map);
    }

    const link = await getLink(m, "mappack", false, true);
    if (link && !cleanLink(link).endsWith(".zip")) {
        await respond(m, "Pleaseee provide a proper .zip file STOP TROLLING ME");
        return;
    }

    try {
        let zipStream: Readable | undefined = undefined;
        if (link)
            zipStream = download(link);
        else {
            const names = updatedMaps.map(map => map.beatmap ? `${map.beatmap.beatmapset.ID} ${map.beatmap.beatmapset.artist} - ${map.beatmap.beatmapset.title}.osz` : `${map.customBeatmap!.ID} ${map.customBeatmap!.artist} - ${map.customBeatmap!.title}.osz`);
            const dlLinks = updatedMaps.map(map => map.beatmap ? `https://osu.direct/api/d/${map.beatmap.beatmapsetID}${video ? "" : "n"}` : map.customBeatmap?.link ?? ``).filter(l => l !== ``);
            const streams = dlLinks.map(dlLink => download(dlLink));
            zipStream = zipFiles(streams.map((d, i) => ({ content: d, name: names[i] })));
        }

        const s3Key = `${randomUUID()}/${packName}.zip`;

        if (bucket === "mappacksTemp") {
            await buckets.mappacksTemp.putObject(s3Key, zipStream, "application/zip");
            const url = await buckets.mappacksTemp.getSignedUrl(s3Key, 60 * 60 * 24);
            return url;
        }

        await buckets.mappacks.putObject(s3Key, zipStream, "application/zip");
        const url = buckets.mappacks.getPublicUrl(s3Key);
        return url;
    } catch (e) {
        await respond(m, "Failed to create pack. Contact VINXIS");
        console.log(e);
        return;
    }
}

export async function deletePack (bucket: "mappacks" | "mappacksTemp", mappool: Mappool) {
    if (!mappool.mappackLink)
        return;

    const s3Key = gets3Key(bucket, mappool);
    if (s3Key)
        await buckets[bucket].deleteObject(s3Key);

    mappool.mappackLink = mappool.mappackExpiry = null;
    await mappool.save();
}
