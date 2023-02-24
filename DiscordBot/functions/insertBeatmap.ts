import { Beatmap } from "../../Models/beatmap";
import { Beatmap as APIBeatmap } from "nodesu";
import { ModeDivision, ModeDivisionType } from "../../Models/MCA_AYIM/modeDivision";
import { isPossessive } from "../../Models/MCA_AYIM/guestRequest";
import { User } from "../../Models/user";
import { MCAEligibility } from "../../Models/MCA_AYIM/mcaEligibility";
import { modeList } from "../../Interfaces/modes";
import { Beatmapset } from "../../Models/beatmapset";
import { genres, langs } from "../../Interfaces/beatmap";

export async function getModeDivison (modeDivisionId: number) {
    modeDivisionId += 1;
    let mode = await ModeDivision.findOne({ where: { ID: modeDivisionId }});
    if (!mode) {
        mode = new ModeDivision;
        mode.ID = modeDivisionId;
        mode.name = ModeDivisionType[mode.ID];
        mode = await mode.save();
    }
    return mode;
}

export async function getMCAEligibility (year: number, user: User) {
    let eligibility = await MCAEligibility.findOne({ relations: ["user"], where: { year, user: { ID: user.ID }}});
    if (!eligibility) {
        eligibility = new MCAEligibility();
        eligibility.year = year;
        eligibility.user = user;
    }
    return eligibility;
}

export async function getBeatmapSet (beatmap: APIBeatmap): Promise<Beatmapset> {
    let beatmapSet = new Beatmapset;
    beatmapSet.ID = beatmap.setId;
    beatmapSet.approvedDate = beatmap.approvedDate;
    beatmapSet.submitDate = beatmap.submitDate;
    beatmapSet.BPM = beatmap.bpm;
    beatmapSet.artist = beatmap.artist;
    beatmapSet.title = beatmap.title;
    beatmapSet.genre = genres[beatmap.genre];
    beatmapSet.language = langs[beatmap.language];
    beatmapSet.tags = beatmap.tags.join(" ");
    beatmapSet.favourites = beatmap.favoriteCount;

    const user = await getUser({ username: beatmap.creator, userID: beatmap.creatorId });
    beatmapSet.creator = user;
    
    beatmapSet = await beatmapSet.save();
    return beatmapSet;
}

export async function insertBeatmap (apiBeatmap: APIBeatmap) {
    let beatmap = new Beatmap;
    beatmap.ID = apiBeatmap.id;
    beatmap.mode = await getModeDivison(apiBeatmap.mode as number);
    beatmap.difficulty = apiBeatmap.version;
    beatmap.circleSize = apiBeatmap.CS;
    beatmap.approachRate = apiBeatmap.AR;
    beatmap.overallDifficulty = apiBeatmap.OD;
    beatmap.hpDrain = apiBeatmap.HP;
    beatmap.circles = apiBeatmap.countNormal;
    beatmap.sliders = apiBeatmap.countSlider;
    beatmap.spinners = apiBeatmap.countSpinner;
    beatmap.rating = apiBeatmap.rating;
    beatmap.passCount = apiBeatmap.passcount;
    beatmap.hitLength = apiBeatmap.hitLength;
    beatmap.totalLength = apiBeatmap.totalLength;
    beatmap.totalSR = apiBeatmap.difficultyRating;
    beatmap.aimSR = apiBeatmap.diffAim;
    beatmap.speedSR = apiBeatmap.diffSpeed;
    beatmap.maxCombo = apiBeatmap.maxCombo;
    beatmap.playCount = apiBeatmap.playcount;
    beatmap.packs = apiBeatmap.packs?.join(",");
    beatmap.storyboard = apiBeatmap.storyboard;
    beatmap.video = apiBeatmap.video;

    beatmap.beatmapset = await getBeatmapSet(apiBeatmap);

    if (!isPossessive(beatmap.difficulty)) {
        const eligibility = await getMCAEligibility(apiBeatmap.approvedDate.getUTCFullYear(), beatmap.beatmapset.creator);
        if (!eligibility[modeList[apiBeatmap.mode as number]]) {
            eligibility[modeList[apiBeatmap.mode as number]] = true;
            eligibility.storyboard = true;
            await eligibility.save();
        }
    }

    beatmap = await beatmap.save();
    return beatmap;
}