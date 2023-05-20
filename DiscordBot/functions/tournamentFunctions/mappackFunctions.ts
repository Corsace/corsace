import { ChatInputCommandInteraction, Message } from "discord.js";
import { Mappool } from "../../../Models/tournaments/mappools/mappool";
import { randomUUID } from "crypto";
import { gets3Key } from "../../../Server/utils/s3";
import { buckets } from "../../../Server/s3";
import { download } from "../../../Server/utils/download";
import { zipFiles } from "../../../Server/utils/zip";
import respond from "../respond";

export async function createPack (m: Message | ChatInputCommandInteraction, bucket: "mappacks" | "mappacksTemp", mappool: Mappool, packName: string, video: boolean = false): Promise<string | undefined> {
    const mappoolMaps = mappool.slots.flatMap(s => s.maps);
    const filteredMaps = mappoolMaps.filter(m => (m.customBeatmap && m.customBeatmap.link) || m.beatmap);
    const names = filteredMaps.map(m => m.beatmap ? `${m.beatmap.beatmapset.ID} ${m.beatmap.beatmapset.artist} - ${m.beatmap.beatmapset.title}.osz` : `${m.customBeatmap!.ID} ${m.customBeatmap!.artist} - ${m.customBeatmap!.title}.osz`);
    const dlLinks = filteredMaps.map(m => m.customBeatmap ? m.customBeatmap.link! : `https://osu.direct/api/d/${m.beatmap!.beatmapsetID}${video ? "" : "n"}`);

    if (filteredMaps.length === 0) {
        await respond(m, `**${mappool.name}** does not have any downloadable beatmaps.`);
        return;
    }
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
        await respond(m, "Failed to create pack. Contact VINXIS.");
        console.log(e);
        return;
    }
}

export async function deletePack (bucket: "mappacks" | "mappacksTemp", mappool: Mappool) {
    const s3Key = gets3Key(bucket, mappool);
    if (s3Key)
        await buckets[bucket].deleteObject(s3Key);
}