import { Beatmap, ModeType, User, UserScore } from "nodesu";

export class ReplayData {

    mode!: ModeType;
    beatmap?: Beatmap;
    player!: User;
    score!: UserScore;

    lifebar: LifeData[] = [];
    playData: PlayData[] = [];
    
    unstableRate?: number;
    earlyHitCount?: number;
    lateHitCount?: number;
    hitErrors: number[] = [];
    
    seed!: number;

    private data: Buffer;

    constructor (data: Buffer, beatmap?: Beatmap, player?: User, score?: UserScore) {
        this.data = data; // To reference in the process of parsing it

        if (beatmap) {
            this.mode = beatmap.mode;
            this.beatmap = beatmap;
            if (player)
                this.player = player;
            if (score)
                this.score = score;
        } else {
            this.parseReplay();
        }
    }

    public parseReplay (this: ReplayData) {

    }

    private getMode (this: ReplayData) {
        
    }

    private getBeatmap (this: ReplayData) {

    }

    private getUser (this: ReplayData) {

    }

    private getScore (this: ReplayData) {

    }

    private getLife (this: ReplayData) {

    }

    private getTime (this: ReplayData) {

    }

    public getPlayData (this: ReplayData) {

    }

    public getUnstableRate (this: ReplayData) {

    }

    public createOSR (this: ReplayData) {

    }
}

export interface LifeData {
    timestamp: number;
    health: number;
}

export interface PlayData {
    timestamp: number;
    timeSince: number;
    x: number;
    y: number;
    pressType: Press;
}

export type Press = number;

export const Press: {
    M1: Press,
    M2: Press,
    K1: Press,
    K2: Press,
    Smoke: Press
} = {
    M1: 1,
    M2: 2,
    K1: 4,
    K2: 8,
    Smoke: 16,
};
