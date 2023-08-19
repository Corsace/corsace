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

export async function createPack (m: Message | ChatInputCommandInteraction, bucket: "mappacks" | "mappacksTemp", mappool: Mappool, packName: string, video = false): Promise<string | undefined> {
    const mappoolMaps = mappool.slots.flatMap(s => s.maps);
    if (bucket === "mappacks" && mappoolMaps.some(m => !m.beatmap)) {
        const slots = mappool.slots.filter(s => s.maps.some(m => !m.beatmap));
        const maps = slots
            .flatMap(s => s.maps.filter(m => !m.beatmap))
            .map(map => `${slots.find(slot => slot.maps.some(m => m.ID === map.ID))!.acronym.toUpperCase()}${map.order}`);
        await respond(m, `**${mappool.name}** doesnt have all finished beatmaps yet, which are ${maps.join(", ")}, remember to run !pfinish or /mappool_finish for them`);
        return;
    }
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

    const link = await getLink(m, "mappack", false, true);
    if (link && !link.endsWith(".zip")) {
        await respond(m, "Pleaseee provide a proper .zip file STOP TROLLING ME");
        return;
    }

    try {
        let zipStream: Readable | undefined = undefined;
        if (link)
            zipStream = download(link);
        else {
            const names = updatedMaps.map(m => m.beatmap ? `${m.beatmap.beatmapset.ID} ${m.beatmap.beatmapset.artist} - ${m.beatmap.beatmapset.title}.osz` : `${m.customBeatmap!.ID} ${m.customBeatmap!.artist} - ${m.customBeatmap!.title}.osz`);
            const dlLinks = updatedMaps.map(m => m.beatmap ? `https://osu.direct/api/d/${m.beatmap!.beatmapsetID}${video ? "" : "n"}` : m.customBeatmap?.link ?? ``).filter(l => l !== ``);
            const streams = dlLinks.map(link => download(link));
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