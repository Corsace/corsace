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

export interface MapperRecord {
    username: string;
    osuId: string;
    value: string;
}

export interface Statistic {
    constraint: string;
    value: string;
}
