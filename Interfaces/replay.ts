import { TextChannel } from "discord.js";
import { config } from "node-config-ts";
import { Beatmap, ModeType, User as APIUser, UserScore } from "nodesu";
import { discordClient } from "../Server/discord";
import { osuClient } from "../Server/osu";
import { diffRange, modAcronyms } from "./mods";
import axios from "axios";
import uleb from "../Server/utils/uleb";
import lzma from "lzma";
import { Beatmap as beatmapParse, HitType } from "osu-bpdpc";
import { HitObject } from "osu-bpdpc/src/Beatmap";
import { OAuth, User } from "../Models/user";

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

    constructor (data: Buffer, mode?: ModeType, beatmap?: Beatmap, player?: User, score?: UserScore) {
        this.data = data;

        if (mode === undefined)
            this.parseBasicInfo();
        else {
            this.mode = mode;
            this.beatmap = beatmap;
            this.player = player!;
            this.score = score!;
            this.getPlayData(true);
        }
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
            const apiUser = await osuClient.user.get(username) as APIUser;
            if (!apiUser)
                return;

            let userQ = await User.findOne({
                osu: { 
                    userID: apiUser.userId.toString(), 
                },
            });
    
            if (!userQ) {
                userQ = new User;
                userQ.country = apiUser.country.toString();
                userQ.osu = new OAuth;
                userQ.osu.userID = `${apiUser.userId}`;
                userQ.osu.username = apiUser.username;
                userQ.osu.avatar = "https://a.ppy.sh/" + apiUser.userId;
                await userQ.save();
            }
            this.player = userQ;
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

    public async getPlayData (this: ReplayData, usedAPI: boolean) {
        if (this.mode !== 0) {
            this.data = Buffer.alloc(0);
            return;
        }

        // Get length, and decompress LZMA stream
        let playBuffer: Buffer;
        let playDataString = "";
        if (!usedAPI) {
            const end = (this.data[3] << 24) | (this.data[2] << 16) | (this.data[1] << 8) | this.data[0];
            this.data = this.data.slice(4);
            playBuffer = this.data.slice(0, end);
        } else
            playBuffer = this.data;

        playDataString = lzma.decompress(playBuffer);
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
        const lines = data.split("\n");
        let stackLeniency = 0.7;
        for (const line of lines) {
            if (/StackLeniency:\s+((\d|\.)+)/i.test(line)) {
                stackLeniency = parseFloat(/StackLeniency:\s+((\d|\.)+)/i.exec(line)![1]);
                break;
            }
        } 
        let beatmap = beatmapParse.fromOsu(data);
        if ((this.score.enabledMods! & modAcronyms.HR) !== 0) {
            for (let i = 0; i < beatmap.HitObjects.length; i++) {
                const obj = beatmap.HitObjects[i];
                if (obj.hitType === HitType.Spinner)
                    continue;

                beatmap.HitObjects[i].pos.y = 384 - beatmap.HitObjects[i].pos.y;
                if (obj.hitType === HitType.Slider)
                    for (let j = 0; j < beatmap.HitObjects[i].curvePoints!.length; j++)
                        beatmap.HitObjects[i].curvePoints![j].y = 384 - beatmap.HitObjects[i].curvePoints![j].y;
            }
        }

        // see https://github.com/ppy/osu/blob/master/osu.Game.Rulesets.Osu/Beatmaps/OsuBeatmapProcessor.cs#L34
        if (beatmap.Version >= 6)
            beatmap = applyStacking(beatmap, stackLeniency);
        else
            beatmap = applyStackingOld(beatmap, stackLeniency);

        const usedPlays: PlayData[] = [];
        let prevHit = true; // NOTELOCK IN CURRENT YEAR!!!! XDDD
        for (let i = 0; i < beatmap.HitObjects.length; i++) {
            const obj = beatmap.HitObjects[i];
            if (obj.hitType === HitType.Spinner)
                continue;
            
            let replayFound = false;
            for (let j = 0; j < this.playData.length; j++) {
                const play = this.playData[j];

                // Check if this play data is within the 50 window
                if (play.timestamp < obj.startTime - window50)
                    continue;
                if (play.timeSince > obj.startTime + window50)
                    break;

                // Check if this was already used
                let used = false;
                for (const usedPlay of usedPlays) {
                    if (usedPlay.timestamp === play.timestamp && usedPlay.x === play.x && usedPlay.y === play.y && usedPlay.pressType === play.pressType) {
                        used = true;
                        break;
                    }
                }
                if (used)
                    continue;

                // Check if play data is a press and in the circle/sliderhead
                const inCircle = Math.pow(play.x - obj.pos.x, 2) + Math.pow(play.y - obj.pos.y, 2) < Math.pow(radius, 2);
                const m1 = (play.pressType & 1) !== 0 && (this.playData[j - 1].pressType & 1) === 0;
                const m2 = (play.pressType & 2) !== 0 && (this.playData[j - 1].pressType & 2) === 0;
                const m3 = (play.pressType & 4) !== 0 && (this.playData[j - 1].pressType & 4) === 0;
                const m4 = (play.pressType & 8) !== 0 && (this.playData[j - 1].pressType & 8) === 0;
                const press = m1 || m2 || m3 || m4;

                // Check notelock
                let notelock = false;
                if (i > 0) {
                    notelock = !prevHit && play.timestamp < beatmap.HitObjects[i - 1].startTime + window50;

                    // Sliders are kinda fucked
                    if (beatmap.HitObjects[i - 1].hitType === HitType.Slider) {
                        const inPrevCircle = Math.pow(play.x - beatmap.HitObjects[i - 1].pos.x, 2) + Math.pow(play.y - beatmap.HitObjects[i - 1].pos.y, 2) < Math.pow(radius, 2);
                        const sliderLock = press && inPrevCircle && play.timestamp < beatmap.HitObjects[i - 1].endTime!;
                        notelock = notelock || sliderLock;
                    }
                }

                if (inCircle && press && !notelock) {
                    this.hitErrors.push(play.timestamp - obj.startTime);
                    usedPlays.push(play);
                    replayFound = true;
                    break;
                }
            }
            prevHit = replayFound;
        }
        
        // Get Std Deviation
        let avgHitError = 0;
        let earlyCount = 0;
        let earlyTotal = 0;
        let lateCount = 0;
        let lateTotal = 0;
        for (const hitError of this.hitErrors) {
            avgHitError += hitError;
            if (hitError >= 0) {
                lateTotal += hitError;
                lateCount++;
            } else {
                earlyTotal += hitError;
                earlyCount++;
            }
        }
        if (earlyCount > 0)
            this.earlyHitCount = earlyTotal / earlyCount;
        if (lateCount > 0)
            this.lateHitCount = lateTotal / lateCount;
        if (this.hitErrors.length - 1 < 0)
            return 0;
        avgHitError /= (this.hitErrors.length - 1);

        let stdDevHitError = 0;
        for (const hitError of this.hitErrors)
            stdDevHitError += Math.pow(hitError - avgHitError, 2);
        stdDevHitError = Math.sqrt(stdDevHitError / this.hitErrors.length);

        let unstableRate = stdDevHitError * 10;
        if ((this.score.enabledMods! & modAcronyms.DT) !== 0)
            unstableRate /= 1.5;
        if ((this.score.enabledMods! & modAcronyms.HT) !== 0)
            unstableRate /= 0.75;

        return unstableRate;
    }

    // public createOSR (this: ReplayData) {

    // }
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

export interface StackObject extends HitObject {
    stackHeight: number;
}

// https://github.com/ppy/osu/blob/master/osu.Game.Rulesets.Osu/Beatmaps/OsuBeatmapProcessor.cs#L41
// https://github.com/VINXIS/maquiaBot/blob/master/structs/replayData.go#L586
function applyStacking (beatmap: beatmapParse, stackLeniency: number): beatmapParse {
    const scale = (1.0 - 0.7 * (beatmap.Difficulty.CircleSize - 5.0) / 5.0) / 2.0;
    const ARMS = diffRange(beatmap.Difficulty.ApproachRate);
    const stackThresh = Math.floor(stackLeniency * ARMS);

    // Get list of objects with the stackheight property
    const rawObjs = beatmap.HitObjects;
    const objs: StackObject[] = [];
    for (const obj of rawObjs) {
        const stackObj = obj as StackObject;
        stackObj.stackHeight = 0;
        objs.push(stackObj);
    }

    // Get stack heights
    for (let i = objs.length - 1; i > 0; i--) {
        let n = i - 1;
        let obji = objs[i];
        if (obji.stackHeight !== 0 || obji.hitType === HitType.Spinner)
            continue;

        if (obji.hitType === HitType.Normal) {
            while (n - 1 >= 0) {
                const objn = objs[n];
                n--;
                if (objn.hitType === HitType.Spinner)
                    continue;

                if (obji.startTime - (objn.hitType === HitType.Slider ? objn.endTime! : objn.startTime) > stackThresh)
                    break;

                if (objn.hitType === HitType.Slider && objn.curvePoints![objn.curvePoints!.length - 1].distance(obji.pos) < 3) {
                    const offset = obji.stackHeight - objn.stackHeight + 1;

                    for (let j = n + 1; j <= i; j++) {
                        const objj = objs[j];
                        if (objn.curvePoints![objn.curvePoints!.length - 1].distance(objj.pos) < 3)
                            objj.stackHeight -= offset;
                        objs[j] = objj;
                    }

                    break;
                }

                if (objn.pos.distance(obji.pos) < 3) {
                    objn.stackHeight = obji.stackHeight + 1;
                    obji = objn;
                    objs[n] = objn;
                }
            }
        } else if (obji.hitType === HitType.Slider) {
            while (n - 1 >= 0) {
                const objn = objs[n];
                n--;
                if (objn.hitType === HitType.Spinner)
                    continue;
                    
                if (obji.startTime - objn.startTime > stackThresh)
                    break;
                
                if (objn.pos.distance(obji.pos) < 3) {
                    objn.stackHeight = obji.stackHeight + 1;
                    obji = objn;
                    objs[n] = objn;
                }
            } 
        }
    }

    for (let i = 0; i < beatmap.HitObjects.length - 1; i++) {
        const offset = objs[i].stackHeight * scale * -6.4;
        beatmap.HitObjects[i].pos.x += offset;
        beatmap.HitObjects[i].pos.y += offset;
    }

    return beatmap;
}

// https://github.com/ppy/osu/blob/master/osu.Game.Rulesets.Osu/Beatmaps/OsuBeatmapProcessor.cs#L193
// https://github.com/VINXIS/maquiaBot/blob/master/structs/replayData.go#L665
function applyStackingOld (beatmap: beatmapParse, stackLeniency: number): beatmapParse {
    const scale = (1.0 - 0.7 * (beatmap.Difficulty.CircleSize - 5.0) / 5.0) / 2.0;
    const ARMS = diffRange(beatmap.Difficulty.ApproachRate);
    const stackThresh = Math.floor(stackLeniency * ARMS);

    // Get list of objects with the stackheight property
    const rawObjs = beatmap.HitObjects;
    const objs: StackObject[] = [];
    for (const obj of rawObjs) {
        const stackObj = obj as StackObject;
        stackObj.stackHeight = 0;
        objs.push(stackObj);
    }

    for (let i = 0; i < objs.length; i++) {
        const obji = objs[i];
        if (obji.stackHeight !== 0 && obji.hitType !== HitType.Slider)
            continue;

        let sliderStack = 0;
        let startTime = obji.startTime;
        let pos2 = obji.pos;
        if (obji.hitType === HitType.Slider) {
            startTime = obji.endTime!;
            pos2 = obji.curvePoints![obji.curvePoints!.length - 1];
        }

        for (let j = i + 1; j < objs.length; j++) {
            const objj = objs[j];
            if (objj.startTime - stackThresh > startTime)
                break;

            if (objj.pos.distance(obji.pos) < 3) {
                obji.stackHeight++;
                startTime = objj.startTime;
                if (objj.hitType === HitType.Slider)
                    startTime = objj.endTime!;
            }
            if (objj.pos.distance(pos2) < 3) {
                sliderStack++;
                obji.stackHeight -= sliderStack;
                startTime = objj.startTime;
                if (objj.hitType === HitType.Slider)
                    startTime = objj.endTime!;
            }
            objs[j] = objj;
        }

        objs[i] = obji;
    }

    for (let i = 0; i < beatmap.HitObjects.length - 1; i++) {
        const offset = objs[i].stackHeight * scale * -6.4;
        beatmap.HitObjects[i].pos.x += offset;
        beatmap.HitObjects[i].pos.y += offset;
    }

    return beatmap;
}