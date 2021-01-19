export interface BeatmapsetRecord {
    beatmapset: {
        id: number,
        artist: string,
        title: string,
    },
    creator: {
        id: number,
        osuId: string,
        username: string,
    },
    value: string;
}
