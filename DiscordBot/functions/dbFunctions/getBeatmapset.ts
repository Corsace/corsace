import { Beatmap as APIBeatmap } from "nodesu";
import { Beatmapset } from "../../../Models/beatmapset";
import { osuClient } from "../../../Server/osu";
import { genres, langs } from "../../../Interfaces/beatmap";
import getUser from "./getUser";

export default async function getBeatmapset (apiBeatmap: APIBeatmap | number, save: boolean) {
    const targetBeatmap: APIBeatmap | undefined = typeof apiBeatmap === "number" ? (await osuClient.beatmaps.getBySetId(apiBeatmap) as APIBeatmap[])[0] : apiBeatmap;
    if (!targetBeatmap)
        return;

    let beatmapSet = await Beatmapset.findOne({ where: { ID: targetBeatmap.beatmapSetId }});
    if (beatmapSet)
        return beatmapSet;
    if (!save)
        return;

    beatmapSet = new Beatmapset;
    beatmapSet.ID = targetBeatmap.beatmapSetId;
    beatmapSet.approvedDate = targetBeatmap.approvedDate;
    beatmapSet.submitDate = targetBeatmap.submitDate;
    beatmapSet.BPM = targetBeatmap.bpm;
    beatmapSet.artist = targetBeatmap.artist;
    beatmapSet.title = targetBeatmap.title;
    beatmapSet.genre = genres[targetBeatmap.genre];
    beatmapSet.language = langs[targetBeatmap.language];
    beatmapSet.tags = targetBeatmap.tags.join(" ");
    beatmapSet.favourites = targetBeatmap.favoriteCount;

    const user = await getUser(targetBeatmap.creatorId, "osu", save);
    if (!user)
        return;
    beatmapSet.creator = user;
    
    beatmapSet = await beatmapSet.save();
    return beatmapSet;
}