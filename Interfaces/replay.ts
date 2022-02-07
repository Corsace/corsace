import { TextChannel } from "discord.js";
import { config } from "node-config-ts";
import { Beatmap, ModeType, User, UserScore } from "nodesu";
import { discordClient } from "../Server/discord";
import { osuClient } from "../Server/osu";
import { modAcronyms } from "./mods";
import axios from "axios";
import uleb from "../Server/utils/uleb";
import lzma from "lzma-native";
import { beatmap, objtypes, parser } from "ojsama";

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

    private data: Buffer; // To reference in the process of parsing it

    constructor (data: Buffer, parseReplay: boolean) {
        this.data = data;

        if (parseReplay)
            this.parseBasicInfo();
        else
            this.getPlayData(true);
    }

    public async parseBasicInfo (this: ReplayData) {
        await this.getMode();
        await this.getBeatmap();
        await this.getUser();

        if (this.data[0] === 0) {
            this.data = this.data.slice(1);
        } else {
            this.data = this.data.slice(1);
            const [hashLength, offset] = uleb.decode(this.data);
            this.data = this.data.slice(hashLength + offset - 1);
        }

        await this.getScore();
        await this.getLife();
        await this.getTime();
        await this.getPlayData(false);
    }

    private getMode (this: ReplayData) {
        this.mode = this.data[0];
        this.data = this.data.slice(5);
        if (this.mode > 4)
            this.mode = 0;
    }

    private async getBeatmap (this: ReplayData) {
        let hash = "";
        if (this.data[0] === 0) {
            this.data = this.data.slice(1);
            return;
        }
        this.data = this.data.slice(1);
        const [hashLength, offset] = uleb.decode(this.data);
        hash = this.data.slice(offset, hashLength).toString();
        this.data = this.data.slice(hashLength + offset - 1);

        try {
            const beatmap = await osuClient.beatmaps.getByBeatmapHash(hash) as Beatmap[];
            if (beatmap.length === 0)
                return;
            this.beatmap = beatmap[0];
        } catch (e: any) {
            if (e)
                (await discordClient.channels.fetch(config.discord.coreChannel) as TextChannel).send(e.toString());
        }
    }

    private async getUser (this: ReplayData) {
        let username = "";
        if (this.data[0] === 0) {
            this.data = this.data.slice(1);
            return;
        }
        this.data = this.data.slice(1);
        const [usernameLength, offset] = uleb.decode(this.data);
        username = this.data.slice(offset, usernameLength).toString();
        this.data = this.data.slice(usernameLength + offset - 1);

        try {
            this.player = await osuClient.user.get(username) as User;
        } catch (e: any) {
            if (e)
                (await discordClient.channels.fetch(config.discord.coreChannel) as TextChannel).send(e.toString());
        }
    }

    private getScore (this: ReplayData) {
        this.score = {
            count300: (this.data[1] << 8) | this.data[0],
            count100: (this.data[3] << 8) | this.data[2],
            count50: (this.data[5] << 8) | this.data[4],
            countGeki: (this.data[7] << 8) | this.data[6],
            countKatu: (this.data[8] << 8) | this.data[8],
            countMiss: (this.data[11] << 8) | this.data[10],
            score: (this.data[15] << 24) | (this.data[14] << 16) | (this.data[13] << 8) | this.data[12],
            maxCombo: (this.data[17] << 8) | this.data[16],
            perfect: this.data[18] === 1,
            enabledMods: (this.data[15] << 24) | (this.data[14] << 16) | (this.data[13] << 8) | this.data[12],
        } as UserScore;
        this.data = this.data.slice(23);

        const percent300 = this.score.count300 / (this.score.countMiss + this.score.count50 + this.score.count100 + this.score.count300);
        const percent50 = this.score.count50 / (this.score.countMiss + this.score.count50 + this.score.count100 + this.score.count300);
        if (percent300 === 1)
            this.score.rank = "SS";
        else if (percent300 > 0.9 && percent50 < 0.01 && this.score.countMiss === 0)
            this.score.rank = "S";
        else if ((percent300 > 0.8 && this.score.countMiss === 0) || percent300 > 0.9)
            this.score.rank = "A";
        else if ((percent300 > 0.7 && this.score.countMiss === 0) || percent300 > 0.8)
            this.score.rank = "B";
        else if (percent300 > 0.6)
            this.score.rank = "C";
        else
            this.score.rank = "D";

        if (
            ((this.score.enabledMods! & modAcronyms.FL) !== 0 || (this.score.enabledMods! & modAcronyms.HD) !== 0) &&
            (this.score.rank === "SS" || this.score.rank === "S")
        )
            this.score.rank += "H";
    }

    private getLife (this: ReplayData) {
        if (this.data[0] === 0) {
            this.data = this.data.slice(1);
            return;
        }
        this.data = this.data.slice(1);
        const [lifeLength, offset] = uleb.decode(this.data);
        const lifeData = this.data.slice(offset, lifeLength).toString().split(",");
        for (const interval of lifeData) {
            const parts = interval.split("|");
            if (parts.length < 2)
                continue;
            const timestamp = parseInt(parts[0]);
            const health = parseFloat(parts[1]);
            this.lifebar.push({
                timestamp,
                health,
            });
        }

        this.data = this.data.slice(lifeLength + offset - 1);
    }

    private getTime (this: ReplayData) {
        const ticks =   this.data[7] << 56 |
                        this.data[6] << 48 |
                        this.data[5] << 40 |
                        this.data[4] << 32 |
                        this.data[3] << 24 |
                        this.data[2] << 16 |
                        this.data[1] << 8 |
                        this.data[0];
        this.data = this.data.slice(8);
    
        const ms = ticks / 10 - 6.3115e+13; // ticks -> ms - 2001 years in ms
        let date = new Date("01-01-2001");
        date = new Date(date.getTime() + ms);

        this.score.date = date;
    }

    public getPlayData (this: ReplayData, usedAPI: boolean) {
        if (this.mode !== 0) {
            this.data = Buffer.alloc(0);
            return;
        }

        // Get length, and decompress LZMA stream
        let playBuffer = Buffer.alloc(0);
        let playDataString = "";
        if (!usedAPI) {
            const end = (this.data[3] << 24) | (this.data[2] << 16) | (this.data[1] << 8) | this.data[0];
            this.data = this.data.slice(4);
            playBuffer = this.data.slice(0, end);
        } else
            playBuffer = this.data;
        lzma.decompress(playBuffer, undefined, (res: Buffer) => {
            playDataString = res.toString();
        });
        this.data = Buffer.alloc(0); // goobye
        if (playDataString === "")
            return;
        
        // Get play data
        const hits = playDataString.split(",");
        let timeElapsed = 0;
        for (const hit of hits) {
            const parts = hit.split("|");
            if (parts.length < 3)
                break;
            if (parts[0] === "-12345" && parts[1] === "0" && parts[2] === "0") {
                this.seed = parseFloat(parts[3]);
                break;
            }

            // Obtain this hit's data
            const timeSince = parseInt(parts[0]);
            const x = parseFloat(parts[1]);
            const y = parseFloat(parts[2]);
            const press = parseInt(parts[3]);
            timeElapsed += timeSince;
            this.playData.push({
                timestamp: timeElapsed,
                timeSince,
                x,
                y,
                pressType: press,
            });
        }
    }

    public async getUnstableRate (this: ReplayData) {
        if (this.playData.length === 0 || !this.beatmap)
            return 0;
        
        // Get info for helping to determine hit error // TODO: more analysis on notelock (maybe specifically slider notelock)
        const radius = 64.0 * (1.0 - 0.7 * (this.beatmap!.circleSize - 5.0) / 5.0) / 2.0;
        const window50 = 199.5 - this.beatmap.overallDifficulty * 10;

        const { data } = await axios.get(`https://osu.ppy.sh/osu/${this.beatmap.id}`);
        let beatmap = new parser().feed(data).map;
        if ((this.score.enabledMods! & modAcronyms.HR) !== 0) {
            for (let i = 0; i < beatmap.objects.length; i++) {
                const obj = beatmap.objects[i];
                if (obj.type === objtypes.spinner)
                    continue;
                beatmap.objects[i].data!.pos[1] = 384 - obj.data!.pos[1];
            }
        }

        const version = beatmap.format_version;
        if (version >= 6)
            beatmap = applyStacking(beatmap);
        else
            beatmap = applyStackingOld(beatmap);
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

function applyStacking (beatmap: beatmap): beatmap {

}

function applyStackingOld (beatmap: beatmap): beatmap {

}