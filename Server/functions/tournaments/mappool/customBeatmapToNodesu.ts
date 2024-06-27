import { Beatmap } from "nodesu";
import { MappoolMap } from "../../../../Models/tournaments/mappools/mappoolMap";

interface CustomBeatmapToNodesu {
    customBeatmap: NonNullable<MappoolMap["customBeatmap"]>;
    customMappers: NonNullable<MappoolMap["customMappers"]>;
    createdAt: NonNullable<MappoolMap["createdAt"]>;
    lastUpdate: NonNullable<MappoolMap["lastUpdate"]>;
}

export default function customBeatmapToNodesu ({ customBeatmap, customMappers, createdAt, lastUpdate }: CustomBeatmapToNodesu) {
    return new Beatmap({
        "beatmapset_id": "-1",
        "beatmap_id": "-1",
        "approved": "-3",
        "total_length": `${customBeatmap.totalLength}`,
        "hit_length": `${customBeatmap.hitLength}`,
        "version": customBeatmap.difficulty,
        "file_md5": "",
        "diff_size": `${customBeatmap.circleSize}`,
        "diff_overall": `${customBeatmap.overallDifficulty}`,
        "diff_approach": `${customBeatmap.approachRate}`,
        "diff_drain": `${customBeatmap.hpDrain}`,
        "mode": `${customBeatmap.mode.ID - 1}`,
        "count_normal": `${customBeatmap.circles}`,
        "count_slider": `${customBeatmap.sliders}`,
        "count_spinner": `${customBeatmap.spinners}`,
        "submit_date": [
            createdAt.getUTCMonth() + 1,
            createdAt.getUTCDate(),
            createdAt.getUTCFullYear(),
        ].join("/") + " " + [
            createdAt.getUTCHours(),
            createdAt.getUTCMinutes(),
            createdAt.getUTCSeconds(),
        ].join(":"),
        "approved_date": null,
        "last_update": [
            lastUpdate.getUTCMonth() + 1,
            lastUpdate.getUTCDate(),
            lastUpdate.getUTCFullYear(),
        ].join("/") + " " + [
            lastUpdate.getUTCHours(),
            lastUpdate.getUTCMinutes(),
            lastUpdate.getUTCSeconds(),
        ].join(":"),
        "artist": customBeatmap.artist,
        "artist_unicode": customBeatmap.artist,
        "title": customBeatmap.title,
        "title_unicode": customBeatmap.title,
        "creator": customMappers.map(u => u.osu.username).join(", "),
        "creator_id": "-1",
        "bpm": `${customBeatmap.BPM}`,
        "source": "",
        "tags": `${customBeatmap.link ?? ""}`,
        "genre_id": "0",
        "language_id": "0",
        "favourite_count": "0",
        "rating": "0",
        "storyboard": "0",
        "video": "0",
        "download_unavailable": "0",
        "audio_unavailable": "0",
        "playcount": "0",
        "passcount": "0",
        "packs": null,
        "max_combo": customBeatmap.maxCombo ? `${customBeatmap.maxCombo}` : null,
        "diff_aim": customBeatmap.aimSR ? `${customBeatmap.aimSR}` : null,
        "diff_speed": customBeatmap.speedSR ? `${customBeatmap.speedSR}` : null,
        "difficultyrating": `${customBeatmap.totalSR}`,
    });
}