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

export async function createPack (m: Message | ChatInputCommandInteraction, bucket: "mappacks" | "mappacksTemp", mappool: Mappool, packName: string, video = false): Promise<string | undefined> {
    const mappoolMaps = mappool.slots.flatMap(s => s.maps);
    const filteredMaps = mappoolMaps.filter(m => (m.customBeatmap && m.customBeatmap.link) || m.beatmap);
    if (filteredMaps.length === 0) {
        await respond(m, `**${mappool.name}** doesn't have any downloadable beatmaps`);
        return;
    }
    const updatedMaps: MappoolMap[] = [];
    for (const map of filteredMaps) {
        let beatmap = map.beatmap;
        if (beatmap && beatmap.beatmapset.rankedStatus <= 0) {
            const set = await osuClient.beatmaps.getByBeatmapId(beatmap.ID) as APIBeatmap[];
            const apiMap = set.find(m => m.beatmapId === beatmap!.ID);
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

    const names = updatedMaps.map(m => m.beatmap ? `${m.beatmap.beatmapset.ID} ${m.beatmap.beatmapset.artist} - ${m.beatmap.beatmapset.title}.osz` : `${m.customBeatmap!.ID} ${m.customBeatmap!.artist} - ${m.customBeatmap!.title}.osz`);
    const dlLinks = updatedMaps.map(m => m.customBeatmap ? m.customBeatmap.link! : `https://osu.direct/api/d/${m.beatmap!.beatmapsetID}${video ? "" : "n"}`);

    const streams = dlLinks.map(link => download(link));
    const zipStream = zipFiles(streams.map((d, i) => ({ content: d, name: names[i] })));

    const s3Key = `${randomUUID()}/${packName}.zip`;

    try {
        if (bucket === "mappacksTemp") {
            await buckets.mappacksTemp.putObject(s3Key, zipStream, "application/zip");
            const url = await buckets.mappacksTemp.getSignedUrl(s3Key, 60 * 60 * 24);
            return url;
        }

        await buckets.mappacks.putObject(s3Key, zipStream, "application/zip");
        const url = await buckets.mappacks.getPublicUrl(s3Key);
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